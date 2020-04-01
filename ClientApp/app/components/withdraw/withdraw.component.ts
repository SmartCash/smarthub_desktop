import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared-service.service';
import Swal from 'sweetalert2';
import { Wallet } from '../../models/data/walletv2.data.model';
import { SpinnerService } from '../../services/spinner.service';
import * as $ from 'jquery';

@Component({
    selector: 'withdraw',
    styleUrls: ['./withdraw.component.css'],
    templateUrl: './withdraw.component.html'
})

export class WithdrawComponent implements OnInit, OnDestroy {
    public inProgress: boolean = false;
    public inProgressConfirm: boolean = false;
    public currencie: any;
    public amountToWithdraw: number = 100;
    public spendingWallet: any;
    public userKey: string;
    public myWithdrawls: any[];
    public withdrawCreated: boolean = false;
    public currentWallet: Wallet;
    public currentWalletIndex: number = 0;
    public showWallets: boolean = false;
    public showTerms: boolean = false;
    public termsAcepted: boolean = false;
    public countries = [
        { name: 'Switzerland', code: 'CHE', fiatCurrency: 'CHF', flag: 'ch' },
        { name: 'Portugal', code: 'PRT', fiatCurrency: 'EUR', flag: 'pt' }
    ];
    public countrySelected: any;
    public code2fa = '';

    constructor(private _shared: SharedService, private _spinner: SpinnerService) { }

    async ngOnInit() {
        await this.getMyWithdrawls();
        this.currentWallet = this.getWallets()[0];
    }

    ngOnDestroy() { }

    get cryptoAmount() {
        if (!this.currencie) {
            return;
        }
        return this.amountToWithdraw * this.currencie.smartAmount;
    }

    async getCurrencie(country: any) {
        try {
            this.inProgress = true;
            this._spinner.showSpinner();
            await this._shared.get(`api/withdraw/exchangerate/${country.code}`)
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
                    if (response.isValid) {
                        this.currencie = response.data;
                        this.countrySelected = country;
                    }
                })
                .catch((e) => console.error(e));
        } catch (e) {
            console.error(e.message);
        } finally {
            this._spinner.hideSpinner();
            this.inProgress = false;
        }
    }

    async confirmWithdraw() {
        this.inProgressConfirm = true;
        this._spinner.showSpinner();
        try {
            let body = {
                "CountryCode": this.countrySelected.code,
                "FiatCurrency": this.countrySelected.fiatCurrency,
                "FiatAmount": this.amountToWithdraw,
                "CryptoCurrency": "SMART",
                "CryptoAmount": this.cryptoAmount,
                "FromAddress": this.currentWallet.address,
                "UserKey": this.userKey,
                // "TermsVersion": this.currencie.terms.termsVersionLabel
                "TermsVersion": '',
            };

            if (this._shared.user.is2FAEnabled && this._shared.user.require2faToSend) {
                Object.assign(body, { "code": this.code2fa });
            }

            await this._shared.post('api/withdraw/create', body)
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
                    }
                    if (response.isValid) {
                        this.withdrawCreated = true;
                        this.currencie = null!;
                        this.countrySelected = null!;
                        Swal({
                            type: 'success',
                            text: 'Withdraw has been successfully created!',
                            customClass: 'animated fadeInDown',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            timer: 3000
                        }).then(() => {
                            var _top: any = $('.page-wrapper .card-1 .box-card').offset();
                            $('.page-wrapper').animate({
                                scrollTop: _top.top - 100
                            }, 1000)
                        });
                    }
                })
                .catch((e) => console.error(e));
        } catch (e) {
            console.error(e.message);
        } finally {
            this.inProgressConfirm = false;
            this._spinner.hideSpinner();
            this.getMyWithdrawls();
        }
    }

    showStatusProgress(status: string) {
        const arr: any = ['exchanging', 'awaiting', 'confirming'];
        return arr.includes(status);
    }

    async getMyWithdrawls() {
        try {
            this.myWithdrawls = await this._shared.get('api/withdraw/my')
                .then(response => response.data)
                .catch((e) => console.error(e));
        } catch (e) {
            console.error(e.message);
        } finally { }
    }

    toggleViewer(event: any) {
        event.target.classList.toggle("active");
        event.target.parentNode.nextElementSibling.classList.toggle("active");
    }

    getWallets() {
        return this._shared.wallet.filter((wallet: Wallet) => !wallet.isVault && !wallet.isScheduled);
    }

    changeAmountToWithdraw(event: any) {
        let _value = parseInt(event.target.value);
        let _lastDigit = _value.toString().split('').pop() || "0";
        if (_value > this.currencie.maxAmount) {
            this.amountToWithdraw = this.currencie.maxAmount;
            return;
        }
        if (_value < this.currencie.minAmount) {
            this.amountToWithdraw = this.currencie.minAmount;
            return;
        }
        if (_value % 10 === 0) {
            this.amountToWithdraw = _value;
            return;
        }
        if (_lastDigit < "6") {
            this.amountToWithdraw = Math.ceil(event.target.value / 10 - 1) * 10;
            return
        }
        this.amountToWithdraw = Math.ceil(event.target.value / 10) * 10;
    }
}