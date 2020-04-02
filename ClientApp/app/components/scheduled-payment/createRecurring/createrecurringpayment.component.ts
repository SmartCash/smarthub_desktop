import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from '../../../services/shared-service.service';
import { CurrentPriceService } from '../../../services/current-price.service';
import { WalletService } from '../../../services/wallet.service';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { Wallet } from '../../../models/data/walletv2.data.model';
import { Util } from '../../../models/util';
import { Router } from '@angular/router';
import { SpinnerService } from '../../../services/spinner.service';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'createrecurringpayment',
    styleUrls: ['./createrecurringpayment.component.css'],
    templateUrl: './createrecurringpayment.component.html',
    providers: [DecimalPipe],
})

export class CreateRecurringPaymentComponent implements OnInit {
    @Input() wallet: Wallet;
    public recurringRequest: any;
    public minDateToSend: Date;
    public amountWithFee = 0;
    public fiatList: any = [];
    public transactionExtended = { fee: 0, amountWithConversion: 0, amountWithFee: 0, exchangeRate: 1.0 };
    public hasBalance = false;
    public hasBalanceExceeded = false;
    public recurrencetypes: any = [];
    public inputTypePassword = "password";
    public dateRangePickerConfig = { showWeekNumbers: false }

    constructor(
        public _shared: SharedService,
        private _currentPriceService: CurrentPriceService,
        private _wallet: WalletService,
        private router: Router,
        public spinner: SpinnerService,
        private decimalPipe: DecimalPipe
    ) { }

    async ngOnInit() {
        this.recurringRequest = {
            'IdRecurrenceType': 1,
            'fromAddress': this.wallet.address,
            'toAddress': '',
            'amount': 0,
            'currency': 'SMART',
            'userKey': '',
            'code': '',
            'label': '',
            'startDate': '',
            'endDate': '',
        };
        this.minDateToSend = new Date();
        this.minDateToSend.setDate(this.minDateToSend.getDate() + 1);
        this.fiatList = await this._currentPriceService.getCurrentPriceInExchange();
        await this.getRecurrenceTypes();
    }

    async createRecurringPayment() {
        try {
            await this._shared.post('api/ScheduledPayments/CreateRecurring', this.recurringRequest)
                .then((response: any) => {
                    if (!response) {
                        return;
                    }
                    const swaloptions = {
                        customClass: 'animated fadeInDown',
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        timer: 3000
                    };
                    if (!response.isValid) {
                        const swalError = Object.assign({
                            type: 'warning',
                            text: response.error.message || response.error.Message,
                        }, swaloptions);
                        Swal(swalError);
                        return;
                    }
                    const swalSuccess = Object.assign({
                        type: 'success',
                        text: 'Your Recurring Payment has been created',
                    }, swaloptions);
                    Swal(swalSuccess).then(async (result: any) => {
                        this.router.navigate(['/transactions'], { queryParams: { filter: 'recurringPayment' } });
                    });
                });
        } catch (e) {
            console.error(e.message);
        } finally {
            this.spinner.hideSpinner();
        }
    }

    getFiatList() {
        if (!this.fiatList) {
            return [];
        }

        let currencies = this.fiatList;
        currencies = Object.keys(currencies).map((key: any) => {
            return { name: key, value: currencies[key] }
        });
        currencies = _.orderBy(currencies, 'name', 'asc');
        currencies.unshift({ name: 'SMART', value: 1.0 });
        return currencies;
    }

    async returnConversionRate(coin: any) {
        this.recurringRequest.currency = coin;
        if (coin == 'SMART') {
            this.transactionExtended.exchangeRate = 1.0;
            this.recalculateAmountWithFee();
        } else {
            await this.getExchangeRate(coin);
        }
    }

    recalculateAmountWithFee() {
        var amountWithConversion = this.recurringRequest.amount / this.transactionExtended.exchangeRate;
        var amountWithFee = (amountWithConversion + this.transactionExtended.fee).toFixed(8);

        this.transactionExtended.amountWithConversion = Number(amountWithConversion) || null!;
        this.transactionExtended.amountWithFee = Number(amountWithFee);
        this.hasBalance = this.wallet.balance >= this.transactionExtended.amountWithFee;
        this.hasBalanceExceeded = 2000000000 >= this.transactionExtended.amountWithFee;
    }

    async getExchangeRate(coin: any) {
        this.fiatList = await this._currentPriceService.getCurrentPriceInExchange();
        this.transactionExtended.exchangeRate = this.fiatList[this.recurringRequest.currency];
        this.recalculateAmountWithFee();
    }

    async calculateAmountWithFee(newValue: any) {
        if (!newValue || newValue === '') {
            return;
        }
        await this.getFee();
        this.recalculateAmountWithFee();
    }

    onAmountChange(newValue: any) {
        if (newValue.target.value) {
            newValue.target.value = this.recurringRequest.amount;
        }
        if (newValue.code === "Comma") {
            this.recurringRequest.amount = `${this.recurringRequest.amount}.`;
            newValue.target.value = this.recurringRequest.amount;
        }
    }

    async getFee() {
        let fee = await this._wallet.getPaymentFee(this.recurringRequest);
        if (Util.isValidObject(fee))
            this.transactionExtended.fee = fee.data;
        if (_.isNumber(this.recurringRequest.amount * 1))
            this.recalculateAmountWithFee();
    }

    async getRecurrenceTypes() {
        await this._shared.get('api/ScheduledPayments/GetRecurrenceTypes')
            .then((data: any) => this.recurrencetypes = data.data);
    }

    trackByFn(index: any, item: any) {
        return item.value;
    }

    toggleInputType() {
        this.inputTypePassword = this.inputTypePassword === 'password' ? 'text' : 'password';
    }
}