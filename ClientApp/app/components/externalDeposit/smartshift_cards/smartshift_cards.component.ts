import { Component, Inject, OnInit, OnDestroy, Input, PLATFORM_ID } from '@angular/core';
import { SharedService } from '../../../services/shared-service.service';
import * as _ from 'lodash';
import { DecimalPipe } from '@angular/common';
import { SpinnerService } from '../../../services/spinner.service';
import { DeviceDetectorService } from '../../../modules/ngx-device-detector/device-detector.service';
import { Util } from '../../../models/util';
import Swal from 'sweetalert2';
import * as $ from 'jquery';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'smartshift-cards',
    templateUrl: './smartshift_cards.component.html',
    providers: [DecimalPipe]
})

export class SmartShiftCards implements OnInit, OnDestroy {
    public inProgress: boolean = false;
    public inProgressAddress: boolean = false;
    public inProgressConfirm: boolean = false;
    private intervalTime: number = 30000;
    private intervalTimeAPI: number = 1000;
    public currencies: any = [];
    public fromCurrency: any;
    public errorMessage: string = '';
    public currentCurrencie: any;
    public amountToSend: any = 0;
    public _amountToReceive: any = 0;
    public _myTransactionsList: any;
    public currencieToSearch: string = '';
    public isConfirmedTransaction: boolean = false;
    private timer: any;
    private amountSmartLocked: boolean = false;
    public terms: any;
    public showTerms: boolean = false;
    public invalidRefoundAddress: boolean = false;
    public refundAddress: string = '';
    public termsAcepted: boolean = false;
    public showRefundAddress: boolean = false;
    public code2fa = '';

    _hasQrCode: boolean = true;
    get hasQrCode(): boolean {
        return this._hasQrCode;
    }

    set hasQrCode(value: boolean) {
        this._hasQrCode = value;
    }

    @Input() isDonation: boolean = false;
    @Input() donationUserName: string = null!;
    @Input() donationAddress: string = null!;

    constructor(
        public _shared: SharedService,
        private decimalPipe: DecimalPipe,
        public _spinner: SpinnerService,
        private _device: DeviceDetectorService,
        @Inject(PLATFORM_ID) platformId: Object,
        public route: ActivatedRoute
    ) {
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
        if (this.isDonation) {
            await this.getDonationCurrencies();
        } else {
            await this.getCurrencies();
        }
        this.timer = this.interval();
        await this.getTerms();
    }

    ngOnDestroy() {
        clearInterval(this.timer);
    }

    interval() {
        return setInterval(() => {
            if (this.isDonation) {
                this.getDonationMyTransactions();
            } else {
                this.getMyTransactions();
            }
        }, this.intervalTime)
    }

    async getCurrencies() {
        this.inProgress = true;
        try {
            this.currencies = await this._shared.get('api/smartshift/currencies')
                .then(response => response.data)
                .catch((e) => console.error(e));
            this.fromCurrency = this.currencies[0];
            await this.getAddress();
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgress = false;
        }
    }

    async getAddress() {
        this.inProgressAddress = true;
        this._spinner.showSpinner();
        try {
            this.currentCurrencie = await this._shared.get(`api/smartshift/getaddress/${this.fromCurrency.name}`)
                .then(response => response.data)
                .catch((e) => console.error(e));

            if (this.amountSmartLocked) {
                this.amountToSend = this.decimalPipe.transform(this._amountToReceive * this.currentCurrencie.conversionRate, '1.2-8');
            } else {
                this.amountToSend = this.currentCurrencie.minCoinAmount * 2;
            }
            if (this.currentCurrencie.expectedAmount) {
                this.amountToSend = this.currentCurrencie.expectedAmount;
            }
        } catch (e) {
            console.error(e.message);
        } finally {
            this.isConfirmedTransaction = false;
            this.inProgressAddress = false;
            this._spinner.hideSpinner();
            this.refundAddress = '';
            await this.getMyTransactions();
        }
    }

    async getMyTransactions() {
        this.inProgress = true;
        try {
            this._myTransactionsList = await this._shared.get('api/smartshift/mytransactions')
                .then(response => response.data)
                .catch((e) => console.error(e));
            if (this._myTransactionsList && this._myTransactionsList.length) {
                this.currentCurrencie = this._myTransactionsList.find((transaction: any) => transaction.transactionId === this.currentCurrencie.transactionId);
            }
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgress = false;
        }
    }

    async confirmTransaction(transaction: any) {
        this.inProgressConfirm = true;
        this._spinner.showSpinner();
        try {
            const body = {
                "ExpectedAmount": this.amountToSend,
                "RefundAddress": this.refundAddress,
                "TermsVersion": this.terms.termsVersionLabel,
                "Label": this.route.snapshot.paramMap.get('label')
            };
            if (this._shared.user.is2FAEnabled && this._shared.user.require2faToSend) {
                Object.assign(body, { "code": this.code2fa });
            }
            await this._shared.post(`api/smartshift/confirm/${transaction.transactionId}`, body)
                .then(response => {
                    if (!response.isValid) {
                        Swal({
                            type: 'warning',
                            text: response.error.message || response.error.Message,
                            customClass: 'animated fadeInDown',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            timer: 3000
                        });

                        return;
                    }
                    this.isConfirmedTransaction = true;
                    this.currentCurrencie = response.data;
                })
                .catch((e) => console.error(e));
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgressConfirm = false;
            this._spinner.hideSpinner();
            await this.getMyTransactions();
        }
    }

    async getDonationCurrencies() {
        this.inProgress = true;
        try {
            this.currencies = await this._shared.get2('api/smartshift/donation/currencies', false)
                .then(response => response.data)
                .catch((e) => console.error('Cannot get currencies from donation'));
            this.fromCurrency = this.currencies[0];
            await this.getDonationAddress();
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgress = false;
            this.refundAddress = '';
        }
    }

    async getDonationAddress() {
        this.inProgressAddress = true;
        this._spinner.showSpinner();
        try {
            const body = {
                "UserName": this.donationUserName,
                "Address": this.donationAddress,
                "ExternalUserId": Util.getGUID(),
                "Label": this.route.snapshot.paramMap.get('label')
            };
            this.currentCurrencie = await this._shared.post2(`api/smartshift/donation/donate/${this.fromCurrency.name}`, body, false)
                .then(response => response.data)
                .catch((e) => console.error('Cannot get wallet address from donation'));

            if (this.amountSmartLocked) {
                this.amountToSend = this.decimalPipe.transform(this._amountToReceive * this.currentCurrencie.conversionRate, '1.2-8');
            } else {
                this.amountToSend = this.currentCurrencie.minCoinAmount * 2;
            }
            if (this.currentCurrencie.expectedAmount) {
                this.amountToSend = this.currentCurrencie.expectedAmount;
            }
            this.isConfirmedTransaction = false;
            await this.getDonationMyTransactions();
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgressAddress = false;
            this._spinner.hideSpinner();
        }
    }

    async getDonationMyTransactions() {
        this.inProgress = true;
        try {
            const body = {
                "UserName": this.donationUserName,
                "Address": this.donationAddress,
                "ExternalUserId": Util.getGUID(),
                "Label": this.route.snapshot.paramMap.get('label')
            };
            this._myTransactionsList = await this._shared.post2('api/smartshift/donation/mytransactions', body, false)
                .then(response => response.data)
                .catch((e) => console.error('Cannot get my transactions from donation'));
            if (this._myTransactionsList && this._myTransactionsList.length) {
                this.currentCurrencie = this._myTransactionsList.find((transaction: any) => transaction.transactionId === this.currentCurrencie.transactionId);
            }
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgress = false;
        }
    }

    async donationConfirmTransaction(transaction: any) {
        this.inProgressConfirm = true;
        this._spinner.showSpinner();
        try {
            const body = {
                "ExpectedAmount": this.amountToSend,
                "UserName": this.donationUserName,
                "Address": this.donationAddress,
                "ExternalUserId": Util.getGUID(),
                "RefundAddress": this.refundAddress,
                "TermsVersion": this.terms.termsVersionLabel,
                "Label": this.route.snapshot.paramMap.get('label')
            };
            await this._shared.post2(`api/smartshift/donation/confirm/${transaction.transactionId}`, body, false)
                .then(response => {
                    if (!response.isValid) {
                        Swal({
                            type: 'warning',
                            text: response.error.message || response.error.Message,
                            customClass: 'animated fadeInDown',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            timer: 3000
                        });

                        return;
                    }
                    this.isConfirmedTransaction = true;
                    this.currentCurrencie = response.data;
                })
                .catch((e) => console.error(e));
        } catch (e) {
            console.error(e);
        } finally {
            this.inProgressConfirm = false;
            this._spinner.hideSpinner();
            await this.getDonationMyTransactions();
        }
    }

    async getTerms() {
        this.inProgress = true;
        try {
            this.terms = await this._shared.get2('api/smartshift/terms', false)
                .then(response => response.data)
                .catch((e) => console.error('Cannot get terms of use'));
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgress = false;
        }
    }

    async cancelTransaction(transactionID: string) {
        this.inProgress = true;
        try {
            let response: any;
            if (this.isDonation) {
                const body = {
                    "UserName": this.donationUserName,
                    "Address": this.donationAddress,
                    "ExternalUserId": Util.getGUID(),
                    "Label": this.route.snapshot.paramMap.get('label')
                }
                response = await this._shared.post2(`api/smartshift/donation/cancel/${transactionID}`, body, false)
                    .then(res => res).catch((e) => console.log(e));
                this.getDonationMyTransactions();
            } else {
                response = await this._shared.delete(`api/smartshift/cancel/${transactionID}`)
                    .then(res => res).catch((e) => console.log(e));
                this.getMyTransactions()
            }
            if (!response.isValid) {
                Swal({
                    type: 'warning',
                    text: response.error.message || response.error.Message,
                    customClass: 'animated fadeInDown',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    timer: 3000
                });
            } else {
                Swal({
                    type: 'success',
                    text: 'Transaction has been successfully cancelled!',
                    customClass: 'animated fadeInDown',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    timer: 3000
                });
            }
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgress = false;
        }
    }

    submitConfirm(currencie: any) {
        if (this.isDonation) {
            this.donationConfirmTransaction(currencie)
        } else {
            this.confirmTransaction(currencie);
        }
    }

    get amountToReceive() {
        if (!this.currentCurrencie) {
            return 0;
        }
        if (this.amountSmartLocked) {
            this.amountToSend = this.decimalPipe.transform(this._amountToReceive * this.currentCurrencie.conversionRate, '1.2-8');
            return this._amountToReceive;
        }
        return this.amountToSend / this.currentCurrencie.conversionRate;
    }

    async changeCurrencie(currencie: any) {
        if (this.inProgressAddress) {
            return;
        }
        this.fromCurrency = currencie;
        if (this.isDonation) {
            await this.getDonationAddress();
        } else {
            await this.getAddress()
        }
    }

    async startQR(field: any) {
        // address is the id of the field that will be filled after a successful scan
        $("#iQR").attr("src", "qr/qrcode/index.html?" + field);
    }

    async stopQR() {
        $("#iQR").attr("src", "");
    }

    changeAmountToSend(_event: any) {
        this.amountSmartLocked = false;
        if (isNaN(_event.target.value) || _event.target.value.length > 8) {
            _event.target.value = this.decimalPipe.transform(this.amountToSend, '1.2-8');
            return;
        }
        if (_event.target.value > this.currentCurrencie.maxCoinAmount) {
            _event.target.value = this.decimalPipe.transform(this.currentCurrencie.maxCoinAmount, '1.2-8');
            this.amountToSend = this.decimalPipe.transform(this.currentCurrencie.maxCoinAmount, '1.2-8');
            return;
        }
        if (_event.target.value < this.currentCurrencie.minCoinAmount) {
            _event.target.value = this.decimalPipe.transform(this.currentCurrencie.minCoinAmount, '1.2-8');
            this.amountToSend = this.decimalPipe.transform(this.currentCurrencie.minCoinAmount, '1.2-8');
            return;
        }
        this.amountToSend = this.decimalPipe.transform(_event.target.value, '1.2-8');
    }

    changeAmountToSendSmart(_event: any) {
        this.amountSmartLocked = true;
        if (isNaN(_event.target.value) || _event.target.value.length > 7) {
            return;
        }
        if (_event.target.value > this.currentCurrencie.maxSmartAmount) {
            _event.target.value = this.decimalPipe.transform(this.currentCurrencie.maxSmartAmount, '1.2-4');
            this.amountToSend = this.decimalPipe.transform(this.currentCurrencie.maxCoinAmount, '1.2-8');
            return;
        }
        if (_event.target.value * this.currentCurrencie.conversionRate < this.currentCurrencie.minCoinAmount) {
            _event.target.value = this.decimalPipe.transform(this.currentCurrencie.minCoinAmount / this.currentCurrencie.conversionRate, '1.2-4');
            this.amountToSend = this.decimalPipe.transform(this.currentCurrencie.minCoinAmount, '1.2-8');
            return;
        }
        this._amountToReceive = this.decimalPipe.transform(_event.target.value, '1.2-4');
        this.amountToSend = this.decimalPipe.transform(_event.target.value * this.currentCurrencie.conversionRate, '1.2-8');
    }

    showStatusProgress(status: string) {
        const arr: any = ['exchanging', 'awaiting', 'confirming'];
        return arr.includes(status);
    }

    trackByFn(index: number, item: any) {
        return index;
    }

    filterCurrencies() {
        if (!this.currencies) {
            return [];
        }
        const currencies = this.currencies.filter((currencie: any) => currencie.name !== 'smart');
        if (this.currencieToSearch.length) {
            return currencies.filter((currencie: any) => {
                return _.startsWith(currencie.fullName.toLowerCase(), this.currencieToSearch.toLowerCase()) || _.startsWith(currencie.name.toLowerCase(), this.currencieToSearch.toLowerCase());
            });
        }
        return currencies;
    }

    validateRefund(e: any) {
        if (_.startsWith(e, '8') || _.startsWith(e, 'S')) {
            return this.invalidRefoundAddress = true;
        }
        return this.invalidRefoundAddress = false;
    }

    toggleViewer(event: any) {
        event.target.classList.toggle("active");
        event.target.parentNode.nextElementSibling.classList.toggle("active");
    }

    get myTransactionsList() {
        if (!this._myTransactionsList) {
            return [];
        }
        return this._myTransactionsList.filter((transaction: any) => transaction.status !== 'new');
    }

    get getQRCodeData() {
        let currencie = this.currencies.find((currencie: any) => currencie.name === this.currentCurrencie.currencyFrom);
        let prefix = `${currencie.fullName.toLowerCase().replace(' ', '')}:`;
        let payInAddress = this.currentCurrencie.payinAddress;
        let payInAddressWithPrefix = `${prefix}${this.currentCurrencie.payinAddress}`;
        let payInAddressHasPrefix = this.currentCurrencie.payinAddress.indexOf(prefix) !== -1;
        return `${payInAddressHasPrefix ? payInAddress : payInAddressWithPrefix}?amount=${this.amountToSend}&message=SmartShift`;
    }
}