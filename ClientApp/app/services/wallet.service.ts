import { Injectable, Inject } from "@angular/core";
import { SharedService } from "./shared-service.service";
import { Wallet } from "../models/data/walletv2.data.model";

import * as smartCash from 'smartcashjs-lib/src';
import * as _ from 'lodash';
import * as aes256 from 'aes256';

@Injectable()
export class WalletService {

    constructor(
        protected _shared: SharedService,
        @Inject('BASE_URL') public baseUrl: string
    ) {
    }

    async sendPayment(transaction: any): Promise<any> {

        let ret: Promise<any>;
        try {


            let wallet = this._shared.dataStore.wallet.find((w: Wallet) => w.address === transaction.FromAddress);

            let privateKey: string = "";

            if (_.isUndefined(wallet) || _.isNull(wallet) || _.isEmpty(wallet))
                throw Error("You need a private key in order to send it");
            else {
                privateKey = aes256.decrypt(transaction.UserKey, wallet.key);
            }

            if (_.isEmpty(privateKey))
                throw Error("You need a private key in order to send it");

            ret = this.createAndSendRawTransaction(transaction.ToAddress, transaction.Amount, privateKey!);
        } catch (ex) {
            try {
                ret = this._shared.post("api/Wallet/SendPayment", transaction);
            } catch (e) {
                throw e;
            }
        }
        return ret;
    }

    async getPaymentFee(transaction: any): Promise<any> {
        return await this._shared.post("api/Wallet/GetPaymentFee", transaction);
    }

    async importWallet(transaction: any): Promise<any> {
        return await this._shared.post("api/Wallet/ImportWallet", transaction);
    }

    async exportWallet(transaction: any): Promise<any> {
        return await this._shared.post("api/Wallet/ExportWallet", transaction);
    }

    async getWallet() {
        return await this._shared.get(`api/Wallet/Get`)
            .then(response => {

                this._shared.dataStore.wallet = Wallet.map(response.data);

                return this._shared.dataStore.wallet;
            }
            )
            .catch(function (e) {
                console.log(e);
            });
    }

    //SAPI
    async createAndSendRawTransaction(toAddress: string, amount: number, keyString: string) {

        let key = smartCash.ECPair.fromWIF(keyString);

        let fromAddress = key.getAddress().toString();

        let transaction = new smartCash.TransactionBuilder();

        let sapiUnspent = await this.getUnspent(fromAddress, amount);

        let totalUnspent = _.sumBy(sapiUnspent.utxos, 'amount');

        let fee = this.calculateFee(sapiUnspent.utxos);

        let change = (totalUnspent - amount - fee);

        if (totalUnspent < (amount + fee))
            throw new Error("The amount exceeds your balance!");

        if (amount < 0.001)
            throw new Error("The amount is smaller than the minimum accepted. Minimum amount: 0.001.");

        transaction.setLockTime(sapiUnspent.blockHeight);

        //SEND TO
        transaction.addOutput(toAddress, parseFloat(smartCash.amount(amount.toString()).toString()));

        if (change >= fee) {
            //Change TO
            transaction.addOutput(fromAddress, parseFloat(smartCash.amount(change.toString()).toString()));
        }
        else {
            fee = change;
        }

        //Add unspent and sign them all
        if (!_.isUndefined(sapiUnspent.utxos) && sapiUnspent.utxos.length > 0) {

            sapiUnspent.utxos.forEach((element: any) => {
                transaction.addInput(element.txid, element.index);
            });

            for (let i = 0; i < sapiUnspent.utxos.length; i += 1) {
                transaction.sign(i, key);
            }
        }

        try {
            let signedTransaction = transaction.build().toHex();
            return await this.sendTransaction(signedTransaction);
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    calculateFee(listUnspent: string | any[]) {

        let fee = 0.002;

        let countUnspent = listUnspent.length;

        var newFee = (((countUnspent * 148) + (2 * 34) + 10 + 9) / 1024) * fee;

        newFee = (0.00003 + (((countUnspent * 148) + (2 * 34) + 10 + 9) / 1024)) * fee;

        if (newFee > fee)
            fee = newFee;

        return this.roundUp(fee, 4);
    }

    round(number: number, decimals: number): number {

        return Math.round(

            parseFloat(number.toString()) * Math.pow(10, decimals),

        ) / Math.pow(10, decimals);

    }

    roundUp(num: number, precision: number) {
        precision = Math.pow(10, precision)
        return Math.ceil(num * precision) / precision
    }

    async getUnspent(address: string, amount: number) {
        try {
            return await this._shared.post("api/Wallet/GetUnpents", {
                "address": address,
                "amount": amount,
                "random": true,
                "instantpay": false
            });
        } catch (err) {
            throw err;
        }
    }

    async sendTransaction(hex: string) {
        try {
            return await this._shared.post("api/Wallet/BroadcastTransaction", {
                data: `${hex}`,
                instantpay: false,
                overrideFees: false
            });
        } catch (err) {
            throw err;
        }
    }
}