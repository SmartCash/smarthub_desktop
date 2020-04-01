import { ChangePasswordComponent } from './components/autentication/change-password.component';
import { ContactComponent } from './components/contact/contact.component';
import { SettingsExportComponent } from './pages/settings/export/export.component';
import { SettingsImportComponent } from './pages/settings/import/import.component';
import { TwoFaComponent } from './pages/settings/twofa/twofa.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ButtonRefreshComponent } from './components/app/refresh-button.component';
import { ButtonBackComponent } from './components/app/back-button.component';
import { SharedService } from './services/shared-service.service';

//PAGES
import { LogoutComponent } from './components/autentication/logout.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './components/autentication/profile.component';
import { DisableTwoFaRecoveryComponent } from './components/autentication/disabletwofa.recovery.component';
import { AppComponent } from './components/app/app.component';
import { HomeComponent } from './components/home/home.component';
import { OverviewComponent } from './components/overview/overview.component';
import { AddressesComponent } from './components/addresses/addresses.component';
import { SendComponent } from './components/send/send.component';
import { ReceiveComponent } from './components/receive/receive.component';
import { RenewComponent } from './components/renew/renew.component';
import { LoginComponent } from './pages/login/login.component';
import { TransactionsPageComponent } from './components/transactions/transactions-page.component';
import { VoteComponent } from './components/vote/vote.component';
import { ProposalComponent } from './components/vote/proposal.component';
import { DonateComponent } from './components/donate/donate.component';
import { TermsOfUseComponent } from './components/terms-of-use/terms.component';
import { ChangellyComponent } from './components/changelly/changelly.component';
import { CardsComponent } from './components/cards/cards.component';
import { CardsCreateComponent } from './components/cards/create/cards.create.component';
import { CardsPreviewComponent } from './components/cards/preview/cards.preview.component';
import { CardsAppComponent } from './components/cards/cardApp/cards.cardapp.component';
import { VaultComponent } from './components/vault/vault.component';
import { VaultWithdrawComponent } from './components/vault/withdraw/vault.withdraw.component';
import { WithdrawComponent } from './components/withdraw/withdraw.component';
import { WithdrawTransactionDescription } from './components/withdraw/withdraw_transaction_descript/withdraw.transaction.description.component';
import { ScheduledPaymentComponent } from './components/scheduled-payment/scheduled-payment.component';
import { DepositScheduledPayment } from './components/scheduled-payment/deposit/deposit.component';

//COMPONENTS
import { BalanceComponent } from './components/balance/balance.component';
import { CurrentBalanceUsdComponent } from "./components/current-balance-usd/current-balance-usd.component";
import { UserInfoComponent } from "./components/user-info/user-info.component";
import { TransactionsComponent } from './components/transactions/transactions.component';
import { CurrentPriceComponent } from "./components/current-price/current-price.component";
import { NavMenuComponent } from './components/navmenu/navmenu.component';
import { TopMenuComponent } from './components/navmenu/topmenu.component';
import { BottomMenuComponent } from './components/navmenu/bottommenu.component';
import { SpinnerComponent } from './components/spinner/spinner.component';

//SERVICES
import { AuthGuard } from './services/auth-guard.service';
import { CurrentPriceService } from './services/current-price.service';
import { UserService } from './services/user.service'
import { WalletService } from './services/wallet.service'
import { BaseLocalStorageService } from "./services/base-localstore.service";
import { TopMenuService } from './services/topmenu.service';
import { CardService } from './services/card.service';
import { SpinnerService } from './services/spinner.service';

//MODULES
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpModule, Http, RequestOptions, XHRBackend } from "@angular/http";
import { CoolStorageModule } from 'angular2-cool-storage';
import { RecaptchaModule } from 'ng-recaptcha';
import { RecaptchaFormsModule } from 'ng-recaptcha/forms';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate';
import { InternationalPhoneNumberModule } from './components/send/phoneNumber/phone-number.module';
import { BsDatepickerModule, ModalModule } from 'ngx-bootstrap';
import { DynamicModule } from 'ng-dynamic-component';
import { NgxMaskModule } from 'ngx-mask';

import { environment } from './app.environment';

export function fnTranslateStaticLoader(http: Http) {
    return new TranslateStaticLoader(http, `${environment.domainUrl}/i18n`, '.json');
}

//PIPE
import { TransactionFilterPipe } from './pipes/transaction-filter.pipe';
import { WalletFilterPipe } from './pipes/wallet-filter.pipe';

import { PageContactComponent } from './components/contact/page-contact.component';
import { SettingsContactComponent } from './pages/settings/settings-contact.component';
import { ProposalDetailComponent } from './components/vote/proposal-detail.component';
import { DeviceDetectorModule } from './modules/ngx-device-detector/index';
import { VoteService } from './services/vote.service';
import { ProposalStatusPipe } from './pipes/proposal-filter.pipe';
import { PaperWalletComponent } from './components/paper-wallet/paper-wallet.component';
import { QRCodeComponent } from './components/paper-wallet/qrCode.component';
import { SafePipe } from './pipes/safe-filter.pipe';
import { CreditCardMaskPipe } from './pipes/creditcard.pipe';
import { httpFactory } from './services/http-interceptor';
import { ExternalDepositComponent } from './components/externalDeposit/externaldeposit.component';
import { SmartShiftCards } from './components/externalDeposit/smartshift_cards/smartshift_cards.component';
import { SmartShiftTransactionDescription } from './components/externalDeposit/smartshift_transaction_descript/smartshift.transaction.description.component';
import { ConfigureScheduledPayment } from './components/scheduled-payment/configure-scheduled-payment/configure-scheduled-payment';
import { CreateRecurringPaymentComponent } from './components/scheduled-payment/createRecurring/createrecurringpayment.component';
import { CreateScheduledPaymentComponent } from './components/scheduled-payment/createScheduled/createscheduledpayment.component';
import { ContactsButtonComponent } from './components/buttons/contacts/contactsbutton.component';
import { ScanBarButtonComponent } from './components/buttons/scanbar/scanbarbutton.component';
import { SmartVaultButtonComponent } from './components/buttons/smartvault/smartvaultbutton.component';
import { WalletsButtonComponent } from './components/buttons/wallets/walletsbutton.component';

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        LogoutComponent,
        TopMenuComponent,
        BottomMenuComponent,
        //
        HomeComponent,
        OverviewComponent,
        AddressesComponent,
        SendComponent,
        ReceiveComponent,
        RenewComponent,
        TransactionsComponent,
        LoginComponent,
        RegisterComponent,
        BalanceComponent,
        TransactionsPageComponent,
        CurrentPriceComponent,
        UserInfoComponent,
        CurrentBalanceUsdComponent,
        TransactionFilterPipe,
        ButtonBackComponent,
        WalletFilterPipe,
        ProfileComponent,
        ButtonRefreshComponent,
        SettingsComponent,
        SettingsImportComponent,
        SettingsExportComponent,
        TermsOfUseComponent,
        TwoFaComponent,
        ContactComponent,
        PageContactComponent,
        SettingsContactComponent,
        VoteComponent,
        ProposalDetailComponent,
        ChangePasswordComponent,
        ProposalComponent,
        ProposalStatusPipe,
        PaperWalletComponent,
        QRCodeComponent,
        DonateComponent,
        DisableTwoFaRecoveryComponent,
        ChangellyComponent,
        SafePipe,
        CardsComponent,
        CardsCreateComponent,
        CardsPreviewComponent,
        CreditCardMaskPipe,
        CardsAppComponent,
        SpinnerComponent,
        VaultComponent,
        VaultWithdrawComponent,
        ExternalDepositComponent,
        SmartShiftCards,
        SmartShiftTransactionDescription,
        WithdrawComponent,
        WithdrawTransactionDescription,
        ScheduledPaymentComponent,
        ConfigureScheduledPayment,
        CreateScheduledPaymentComponent,
        CreateRecurringPaymentComponent,
        DepositScheduledPayment,
        ContactsButtonComponent,
        ScanBarButtonComponent,
        SmartVaultButtonComponent,
        WalletsButtonComponent
    ],
    imports: [
        ModalModule.forRoot(),
        NgxMaskModule.forRoot(),
        DynamicModule.withComponents([]),
        BsDatepickerModule.forRoot(),
        InternationalPhoneNumberModule,
        CoolStorageModule,
        CommonModule,
        HttpModule,
        FormsModule,
        ReactiveFormsModule,
        RecaptchaModule.forRoot(),
        DeviceDetectorModule.forRoot(),
        RecaptchaFormsModule,
        TranslateModule.forRoot({
            provide: TranslateLoader,
            useFactory: fnTranslateStaticLoader,
            deps: [Http]
        }),
        RouterModule.forRoot([
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            { path: 'logout', component: LogoutComponent },
            { path: 'change-password', component: ChangePasswordComponent },
            { path: 'disable2fa', component: DisableTwoFaRecoveryComponent },
            { path: 'home', component: OverviewComponent, canActivate: [AuthGuard] },
            { path: 'overview', component: OverviewComponent, canActivate: [AuthGuard] },
            { path: 'addresses', component: AddressesComponent, canActivate: [AuthGuard] },
            { path: 'to/:address', component: SendComponent, canActivate: [AuthGuard] },
            { path: 'to/:address/:amount', component: SendComponent, canActivate: [AuthGuard] },
            { path: 'send', component: SendComponent, canActivate: [AuthGuard] },
            { path: 'send/:address', component: SendComponent, canActivate: [AuthGuard] },
            { path: 'receive', component: ReceiveComponent, canActivate: [AuthGuard] },
            { path: 'receive/:address', component: ReceiveComponent, canActivate: [AuthGuard] },
            { path: 'renew', component: RenewComponent, canActivate: [AuthGuard] },
            { path: 'transactions', component: TransactionsPageComponent, canActivate: [AuthGuard] },
            { path: 'transactions/:currentWalletAddress', component: TransactionsPageComponent, canActivate: [AuthGuard] },
            { path: 'register', component: RegisterComponent },
            { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
            { path: 'terms', component: TermsOfUseComponent, canActivate: [AuthGuard] },
            // { path: 'donate', component: DonateComponent },
            // { path: 'donate/:userName', component: DonateComponent },
            // { path: 'donate/:userName/:label', component: DonateComponent },
            { path: 'changelly', component: ChangellyComponent, canActivate: [AuthGuard] },
            { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
            { path: 'settings-import', component: SettingsImportComponent, canActivate: [AuthGuard] },
            { path: 'settings-export', component: SettingsExportComponent, canActivate: [AuthGuard] },
            { path: 'settings-twofa', component: TwoFaComponent, canActivate: [AuthGuard] },
            { path: 'contacts', component: PageContactComponent, canActivate: [AuthGuard] },
            { path: 'proposal', component: ProposalComponent },
            { path: 'proposal/detail/:id', component: ProposalDetailComponent },
            { path: 'proposal/vote/:id', component: VoteComponent, canActivate: [AuthGuard] },
            { path: 'paper-wallet', component: PaperWalletComponent },
            { path: 'cards', component: CardsComponent, canActivate: [AuthGuard] },
            { path: 'vault', component: VaultComponent, canActivate: [AuthGuard] },
            { path: 'vault/withdraw/:id/:token', component: VaultWithdrawComponent, canActivate: [AuthGuard] },
            // { path: 'smartshift', component: ExternalDepositComponent, canActivate: [AuthGuard] },
            { path: 'withdraw', component: WithdrawComponent, canActivate: [AuthGuard] },
            { path: 'scheduled-payment', component: ScheduledPaymentComponent, canActivate: [AuthGuard] },
            { path: '**', redirectTo: 'overview' }
        ])
    ],
    providers: [
        UserService,
        WalletService,
        AuthGuard,
        CurrentPriceService,
        BaseLocalStorageService,
        SharedService,
        VoteService,
        TopMenuService,
        CardService,
        SpinnerService,
        {
            provide: Http,
            useFactory: httpFactory,
            deps: [XHRBackend, RequestOptions, Router]
        }
    ]
})
export class AppModuleShared {
}