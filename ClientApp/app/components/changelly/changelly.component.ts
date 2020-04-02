import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared-service.service';
import { ContactResponse } from '../../models/response/contact-response.model';
import { DeviceDetectorService } from '../../modules/ngx-device-detector/device-detector.service';
import { DOCUMENT } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { Wallet } from '../../models/data/walletv2.data.model';
import { Util } from '../../models/util';
import { isPlatformBrowser } from '@angular/common';
import { interval } from 'rxjs/observable/interval';

@Component({
    selector: 'changelly',
    templateUrl: './changelly.component.html'
})

export class ChangellyComponent implements OnInit, OnDestroy {
    public currencies: any;
    public valueToReceive: any;
    public amountToSend: number = 0;
    public amountToReceive: any = 0;
    public fromCurrency: any;
    public coinToReceive: string = 'smart';
    public minAmount: number = 0;
    public smartAddress: string = '';
    public refundAddress: string = '';
    public inProgress: boolean = false;
    public exchangeProgress: boolean = false;
    public transactionProgress: boolean = false;
    public errorMessage: string = '';
    public myTransactionsList: any;
    public _hasQrCode: boolean = true;
    public activeDropbox: boolean = false;
    public currencieToSearch: string = '';
    public createdTransaction: any;
    public createTransactionStatus: any;
    public _: any = _;
    public contacts: any;
    private intervalTime: number = 30000;
    public showWallets: boolean = false;
    public currentWallet: Wallet;
    public currentWalletIndex: number = 0;
    public invalidRefoundAddress: boolean = false;
    public extraFieldName: string = '';
    public extraFieldNameLabel: string = '';
    private timer: any;
    public code2fa = '';

    constructor(
        public _shared: SharedService,
        private _device: DeviceDetectorService,
        @Inject(DOCUMENT) private document: any,
        @Inject(PLATFORM_ID) platformId: Object,
    ) {
        // Hide qr on lame browsers
        let isPWA;
        if (isPlatformBrowser(platformId)) {
            isPWA = window.matchMedia('(display-mode: standalone)').matches;
        }
        let browser = _device.getDeviceInfo().browser;
        let lameBrowsers = ['safari'];
        if (lameBrowsers.indexOf(browser) > -1 && isPWA) {
            this.hasQrCode = false;
        }
    }

    async ngOnInit() {
        await this.getCurrencies();
        await this.getMyTransactions();
        await this.getContacts();
        this.timer = this.interval();
        this.currentWallet = _.first(this._shared.wallet)!;
        this.smartAddress = this.currentWallet.address;
    }

    ngOnDestroy() {
        clearInterval(this.timer);
    }

    interval() {
        return setInterval(() => this.getMyTransactions(), this.intervalTime);
    }

    get hasQrCode(): boolean {
        return this._hasQrCode;
    }

    set hasQrCode(value: boolean) {
        this._hasQrCode = value;
    }

    async getCurrencies() {
        this.inProgress = true;
        try {
            this.currencies = await this._shared.get('api/changelly/currencies')
                .then(response => response.data)
                .catch((e) => console.log(e));
            this.fromCurrency = this.currencies[0];
            this.getMinAmount();
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.inProgress = false;
        }
    }

    async getAmountToReceive() {
        if (!this.amountToSend) {
            return;
        }
        this.inProgress = true;
        try {
            const body: any = {
                "FromCurrency": this.fromCurrency.name,
                "ToCurrency": "SMART",
                "Amount": this.amountToSend
            };
            this.amountToReceive = await this._shared.post('api/changelly/exchangeamount', body).then(response => response.data).catch((e) => console.log(e));
        } catch (e) {
            console.log(e);
            this.errorMessage = e.message;
        } finally {
            this.inProgress = false;
        }
    }

    async getMinAmount() {
        this.inProgress = true;
        try {
            const body: any = {
                "FromCurrency": this.fromCurrency.name,
                "ToCurrency": "SMART"
            };
            this.minAmount = await this._shared.post('api/changelly/minamount', body).then(response => response.data).catch((e) => console.log(e));
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.inProgress = false;
        }
    }

    async getTransaction(transactionID: string) {
        this.inProgress = true;
        try {
            this.createdTransaction = await this._shared.get(`api/changelly/gettransaction/${transactionID}`).then(response => response.data).catch((e) => console.log(e));
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.inProgress = false;
        }
    }

    async getTransactionStatus(transactionID: any) {
        this.exchangeProgress = true;
        try {
            this.createTransactionStatus = await this._shared.get(`api/changelly/status/${transactionID}`).then(response => response.data).catch((e) => console.log(e));
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.exchangeProgress = false;
        }
    }

    async createTransaction() {
        this.inProgress = true;
        try {
            this.extraFieldNameLabel = this.fromCurrency.extraFieldName ? this.fromCurrency.extraFieldName : undefined;
            const body: any = {
                "FromCurrency": this.fromCurrency.name,
                "ToCurrency": "SMART",
                "Address": this.smartAddress,
                "Amount": this.amountToSend,
                "RefundAddress": this.refundAddress,
                "code": this.code2fa
            }
            const body2: any = {
                "FromCurrency": this.fromCurrency.name,
                "ToCurrency": "SMART",
                "Address": this.smartAddress,
                "Amount": this.amountToSend,
                "RefundAddress": this.refundAddress,
                "RefundExtraId": this.extraFieldName,
                "code": this.code2fa
            }
            let bodyToSend = this.fromCurrency.extraFieldName ? body2 : body;
            const response: any = await this._shared.post('api/changelly/transaction', bodyToSend).then(response => response).catch((e) => console.log(e));
            if (response.isValid === false) {
                this.errorMessage = response.error.message || response.error.Message;
            }
            if (response.isValid) {
                this.createdTransaction = response.data.result;
                this.getTransactionStatus(this.createdTransaction.id || this.createdTransaction.transactionId);
                setInterval(() => this.getTransactionStatus(this.createdTransaction.id || this.createdTransaction.transactionId), this.intervalTime);
                setInterval(() => this.getTransaction(this.createdTransaction.id || this.createdTransaction.transactionId), this.intervalTime);
                this.getMyTransactions();
            }
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.inProgress = false;
        }
    }

    async getMyTransactions() {
        this.transactionProgress = true;
        try {
            this.myTransactionsList = await this._shared.get('api/changelly/mytransactions').then(response => response.data).catch((e) => console.log(e));
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.transactionProgress = false;
        }
    }

    async deleteTransaction(transactionID: string) {
        this.transactionProgress = true;
        try {
            await this._shared.delete(`api/changelly/deletetransaction/${transactionID}`)
                .then(response => this.getMyTransactions()).catch((e) => console.log(e));
        } catch (e) {
            this.errorMessage = e.message;
        } finally {
            this.transactionProgress = false;
        }
    }

    toggleViewer(event: any) {
        event.target.classList.toggle("active");
        event.target.parentNode.nextElementSibling.classList.toggle("active");
    }

    changeCurrencie(currencie: any) {
        this.fromCurrency = currencie;
        this.getMinAmount();
        this.getAmountToReceive();
        this.activeDropbox = false;
    }

    filterCurrencies() {
        const currencies = this.currencies.filter((currencie: any) => currencie.name !== 'smart');
        if (this.currencieToSearch.length) {
            return currencies.filter((currencie: any) => {
                return _.startsWith(currencie.fullName.toLowerCase(), this.currencieToSearch.toLowerCase()) || _.startsWith(currencie.name.toLowerCase(), this.currencieToSearch.toLowerCase());
            });
        }
        return currencies;
    }

    async getContacts() {
        this.inProgress = true;
        try {
            this.contacts = await this._shared.get('api/Contact/Get').then(response => {
                return ContactResponse.map(response.data);
            }).catch(function (e) {
                console.log(e);
            });;
        } catch (e) {
            console.log(e);
            this.errorMessage = e.message;
        } finally {
            this.inProgress = false;
        }
    }

    startQR(field: any) {
        // address is the id of the field that will be filled after a successful scan
        $("#iQR").attr("src", "qr/qrcode/index.html?" + field);
    }

    stopQR() {
        $("#iQR").attr("src", "");
    }

    selectWallet(wallet: any) {
        this.smartAddress = wallet.address;
        $('#modalWallets').removeClass("show");
        $('#modalWallets').hide();
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    }

    selectContact(contact: any) {
        this.smartAddress = contact.address;
        $('#myModalContact').removeClass("show");
        $('#myModalContact').hide();
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    }

    trackByFn(index: number, item: any) {
        return index;
    }

    currenciePayinConfirmations(currencieName?: any) {
        if (!this.currencies) {
            return 0;
        }
        return this.currencies.filter((currencie: any) => currencie.name == (currencieName || this.createdTransaction.currencyFrom))[0].payinConfirmations;
    }

    toggleDelete() {
        this.document.querySelector('.page-changelly .transaction-info-content .delete').classList.toggle('active');
    }

    setWallet(currentWallet: Wallet, _index?: number) {
        this.currentWalletIndex = _index || 0;
        this.showWallets = false;
        this.currentWallet = currentWallet;
        this.smartAddress = currentWallet.address;
        $('.page-wrapper').animate({ scrollTop: 0 }, 500);
    }

    validateRefund(e: any) {
        if (_.startsWith(e, '8') || _.startsWith(e, 'S')) {
            return this.invalidRefoundAddress = true;
        }
        return this.invalidRefoundAddress = false;
    }

    showStatusProgress(status: string) {
        const arr: any = ['failed', 'refunded', 'waiting', 'finished', 'new', 'hold'];
        return !arr.includes(status);
    }

    getExtraIdLabel(currencieName?: any) {
        if (!this.currencies) {
            return 0;
        }
        return this.currencies.filter((currencie: any) => currencie.name == (currencieName || this.createdTransaction.currencyFrom))[0].extraFieldName;
    }

    getWallets() {
        return this._shared.wallet.filter((wallet: Wallet) => !wallet.isVault && !wallet.isScheduled);
    }
}