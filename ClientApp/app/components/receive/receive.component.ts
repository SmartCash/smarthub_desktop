import { Component, Inject, OnInit } from '@angular/core';
import { Wallet } from "../../models/data/walletv2.data.model";
import { SharedService } from '../../services/shared-service.service';
import { ActivatedRoute } from '@angular/router';
import { Util } from '../../models/util';
import { CurrentPriceService } from "../../services/current-price.service";
import * as _ from 'lodash';

@Component({
    selector: 'receive',
    templateUrl: './receive.component.html'
})
export class ReceiveComponent implements OnInit {
    currentWallet: Wallet;
    public ticker = "SMART";
    public fiatList: any;
    public sendQrCode = { amount: 0, amountWithConversion: 0, exchangeRate: 1.0 };
    public showWallets: boolean = false;
    public currentWalletIndex: number = 0;

    constructor(
        @Inject('BASE_URL') private baseUrl: string,
        public _shared: SharedService,
        public route: ActivatedRoute,
        private _currentPriceService: CurrentPriceService,
    ) { }

    getFiatList() {
        if (_.isNil(this.fiatList)) {
            return [];
        }

        let currencies = this.fiatList;
        currencies = Object.keys(currencies).map(function (k: any) { return { name: k, value: currencies[k] } })
        currencies = _.orderBy(currencies, 'name', 'asc');
        currencies.unshift({ name: 'SMART', value: 'SMART' });

        return currencies;
    }

    async ngOnInit() {
        this.fiatList = await this._currentPriceService.getListCurrencies();
        if (!Util.isValidObject(this.currentWallet))
            this.currentWallet = _.first(this._shared.wallet)!;
    }

    setWallet(wallet: Wallet, _index?: number) {
        this.currentWalletIndex = _index || 0;
        this.showWallets = false;
        this.currentWallet = wallet;
    }

    getWallets() {
        return this._shared.wallet.filter((wallet: Wallet) => !wallet.isVault && !wallet.isScheduled);
    }

    getQrCodeUrl() {
        const url = `smartcash:${this.currentWallet.address}`;
        if (this.sendQrCode.amountWithConversion == 0) {
            return url;
        }
        else {
            return url + "?amount=" + this.sendQrCode.amountWithConversion
        }
    }

    recalculateAmountWithFee() {
        var amountWithConversion = (this.sendQrCode.amount / this.sendQrCode.exchangeRate)
        this.sendQrCode.amountWithConversion = Number(amountWithConversion.toFixed(8));
    }

    async getExchangeRate() {
        const currency = await this._currentPriceService.getCurrentPriceInExchange(this.ticker);
        this.sendQrCode.exchangeRate = currency.smartcash[this.ticker];
        this.recalculateAmountWithFee();
    }

    async returnConversionRate(coin: any) {
        this.ticker = coin;

        if (coin == 'SMART') {
            this.sendQrCode.exchangeRate = 1.0;
            this.recalculateAmountWithFee();
        } else {
            await this.getExchangeRate();
        }
    }
}