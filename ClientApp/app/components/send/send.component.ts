import { SharedService } from "../../services/shared-service.service";
import { Component, Inject, OnInit, PLATFORM_ID } from "@angular/core";
import { WalletService } from "../../services/wallet.service";
import { CurrentPriceService } from "../../services/current-price.service";
import { Wallet } from "../../models/data/walletv2.data.model";
import { ContactResponse } from "../../models/response/contact-response.model";
import { DeviceDetectorService } from "../../modules/ngx-device-detector/device-detector.service";
import { Util } from "../../models/util";
import { DecimalPipe } from "@angular/common";
import * as _ from "lodash";
import * as $ from "jquery";
import { isPlatformBrowser } from "@angular/common";

import { Router, ActivatedRoute, Params } from "@angular/router";
import { SendRequest } from "../../models/request/send-request.model";
import { UserService } from "../../services/user.service";

@Component({
  selector: "send",
  templateUrl: "./send.component.html",
  providers: [DecimalPipe]
})
export class SendComponent implements OnInit {
  public sub: any;
  public currentWallet: Wallet;
  public response: any;
  public successMessage = "";
  public errorMessage = "";
  public ticker = "SMART";
  public transaction: SendRequest = new SendRequest();
  public contacts: any;
  public _ = _;
  public transactionExtended = {
    fee: 0,
    amountWithConversion: 0,
    amountWithFee: 0,
    exchangeRate: 1.0
  };
  public showWallets: boolean = false;
  public currentWalletIndex: number = 0;
  public _inProgress: boolean = false;
  public typeSend: string = "ADDRESS";
  public filters: any[] = ["ADDRESS", "EMAIL", "SMS"];
  public messageToSend: string = "";
  public fiatList: any;
  public defaultCountry: string = "ax";
  public selectedSendTo: any;
  public smartVault: any;
  public recurrencetypes: any;
  public listWhenSend: string[] = ["Today", "Later", "Recurring"];
  public dateToSend: string = "Today";
  public minDateToSend: Date;
  public patterns = {
    "0": { pattern: new RegExp("^[0-9]+$") }
  };

  get inProgress(): boolean {
    return this._inProgress;
  }

  set inProgress(value: boolean) {
    this._inProgress = value;
  }

  _hasBalance: boolean = true;
  get hasBalance(): boolean {
    return this._hasBalance;
  }

  set hasBalance(value: boolean) {
    this._hasBalance = value;
  }

  _hasBalanceExceeded: boolean = true;
  get hasBalanceExceeded(): boolean {
    return this._hasBalanceExceeded;
  }

  set hasBalanceExceeded(value: boolean) {
    this._hasBalanceExceeded = value;
  }

  _hasQrCode: boolean = true;
  get hasQrCode(): boolean {
    return this._hasQrCode;
  }

  set hasQrCode(value: boolean) {
    this._hasQrCode = value;
  }

  _inputTypePassword: string = "password";
  get inputTypePassword(): string {
    return this._inputTypePassword;
  }
  set inputTypePassword(value: string) {
    this._inputTypePassword = value;
  }

  showPassword() {
    if (this.inputTypePassword === "password") {
      this.inputTypePassword = "text";
    } else {
      this.inputTypePassword = "password";
    }
  }

  constructor(
    public _shared: SharedService,
    private _wallet: WalletService,
    private _router: Router,
    private route: ActivatedRoute,
    _device: DeviceDetectorService,
    private _currentPriceService: CurrentPriceService,
    private _user: UserService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    if (!Util.isValidObject(this.transaction))
      this.transaction = new SendRequest();
    this.setDefaultWallet();

    // Hide qr on lame browsers
    let isPWA;
    if (isPlatformBrowser(platformId)) {
      isPWA = window.matchMedia("(display-mode: standalone)").matches;
    }
    let browser = _device.getDeviceInfo().browser;
    let lameBrowsers = ["safari"];
    if (lameBrowsers.indexOf(browser) > -1 && isPWA) {
      this.hasQrCode = false;
    }

    // Define minDateToSend
    this.minDateToSend = new Date();
    this.minDateToSend.setDate(this.minDateToSend.getDate() + 1);

    this.route.params.subscribe((params: Params) => {
      let address = params["address"];
      if (Util.isValidAndNotEmpty(address))
        this.transaction.toAddress = address.replace(/[\s]/g, "");
      let amount = params["amount"];
      if (!_.isEmpty(amount)) {
        let encodedAmount = decodeURIComponent(amount);
        if (!_.isEmpty(encodedAmount)) {
          encodedAmount = encodedAmount.replace(",", ".");
          let start = encodedAmount.indexOf("%");
          let end = encodedAmount.indexOf("C") + 1;
          let wordToReplace = encodedAmount.substring(start, end);
          if (!_.isEmpty(wordToReplace))
            encodedAmount = encodedAmount.replace(wordToReplace, ".");
        }
        this.transaction.amount = Number(encodedAmount.replace(/[\s]/g, ""));
        this.calculateAmountWithFee(0);
      }
    });
  }

  fill(newValue: any) {
    this.transaction.toAddress = newValue.replace(/[\s]/g, "");
    console.log("FILL CALLED " + newValue);
  }

  async calculateAmountWithFee(newValue: any) {
    if (!newValue || newValue === "") {
      return;
    }
    await this.getFee();
    this.recalculateAmountWithFee();
  }

  onAmountChange(newValue: any) {
    if (newValue.target.value) {
      newValue.target.value = this.transaction.amount;
    }
    if (newValue.code === "Comma") {
      this.transaction.amount = `${this.transaction.amount}.`;
      newValue.target.value = this.transaction.amount;
    }
  }

  async returnConversionRate(coin: any) {
    this.ticker = coin;

    if (coin == "SMART") {
      this.transactionExtended.exchangeRate = 1.0;
      this.recalculateAmountWithFee();
    } else {
      await this.getExchangeRate();
    }
  }

  async getExchangeRate() {
    const currency = await this._currentPriceService.getCurrentPriceInExchange(this.ticker);
    this.transactionExtended.exchangeRate = currency.smartcash[this.ticker];
    this.recalculateAmountWithFee();
  }

  recalculateAmountWithFee() {
    var amountWithConversion =
      this.transaction.amount / this.transactionExtended.exchangeRate;
    var amountWithFee = (
      amountWithConversion + this.transactionExtended.fee
    ).toFixed(8);

    this.transactionExtended.amountWithConversion = Number(
      amountWithConversion.toFixed(8)
    );
    this.transactionExtended.amountWithFee = Number(amountWithFee);
    this.hasBalance =
      this.currentWallet.balance >= this.transactionExtended.amountWithFee;
    this.hasBalanceExceeded =
      2000000000 >= this.transactionExtended.amountWithFee;
  }

  async setDefaultWallet() {
    if (!Util.isValidAndNotEmpty(this.transaction.fromAddress))
      this.transaction.fromAddress = _.first(this._shared.wallet)!.address;

    if (!Util.isValidObject(this.currentWallet))
      this.currentWallet = _.first(this._shared.wallet)!;

    await this.getFee();
  }

  async setWallet(currentWallet: Wallet, _index?: number) {
    this.currentWalletIndex = _index || 0;
    this.showWallets = false;
    $(".page-wrapper").animate({ scrollTop: 0 }, 500);
    this.transaction.fromAddress = currentWallet.address;
    this.currentWallet = currentWallet;
    await this.getFee();
  }

  getAmountPayment(addSmartMailFee = false) {
    let value: any = 0;

    if (this.ticker !== "SMART") {
      value = this.transactionExtended.amountWithConversion;
    } else {
      value = this.transaction.amount;
    }

    if (this.typeSend !== "ADDRESS" && !addSmartMailFee) {
      value = value * 1 + 0.001;
    }

    return Number(parseFloat(parseFloat(value.toString()).toFixed(8))) * 1;
  }

  async getFee() {
    this.transactionExtended.fee = 0.002;
    let fee = await this._wallet.getPaymentFee(this.transaction);
    if (Util.isValidObject(fee) && fee.data > 0.002)
      this.transactionExtended.fee = fee.data;
    if (this.typeSend !== "ADDRESS")
      this.transactionExtended.fee = fee.data + 0.001;
    if (_.isNumber(this.transaction.amount * 1))
      this.recalculateAmountWithFee();
  }

  trackByFn(item: any) {
    return item.value;
  }

  getFiatList() {
    if (_.isNil(this.fiatList)) {
      return [];
    }

    let currencies = this.fiatList;
    currencies = Object.keys(currencies).map(function(k: any) {
      return { name: k, value: currencies[k] };
    });
    currencies = _.orderBy(currencies, "name", "asc");
    currencies.unshift({ name: "SMART", value: "SMART" });

    return currencies;
  }

  async ngOnInit() {
    this.fiatList = await this._currentPriceService.getListCurrencies();

    if (
      !_.isUndefined(this._shared.sendTo) &&
      Util.isValidObject(this._shared.sendTo)
    )
      this.transaction.toAddress = this._shared.sendTo.replace(/[\s]/g, "");

    this.getContacts();

    try {
      this.defaultCountry = this._user.geoIpLookup.country_code
        ? this._user.geoIpLookup.country_code.toLowerCase()
        : "ax";
    } catch (error) {}

    this.smartVault = await this._shared.get("api/vault/get");

    this.getRecurrenceTypes();
  }

  selectSmartVault() {
    this.transaction.toAddress = this.smartVault.data.walletAddress;
    this.selectedSendTo = { name: "SmartVault" };
  }

  async select(contact: any) {
    switch (this.typeSend) {
      case "ADDRESS":
        this.transaction.toAddress = contact.address.replace(/[\s]/g, "");
        break;
      case "EMAIL":
        this.transaction.destinationEmail = contact.email.replace(/[\s]/g, "");
        break;
      case "SMS":
        this.transaction.phoneNumber = contact.phone.replace(/[\s]/g, "");
        break;
    }
    this.selectedSendTo = contact;
    $("#myModalContact").removeClass("show");
    $("#myModalContact").hide();
    $("body").removeClass("modal-open");
    $(".modal-backdrop").remove();
  }

  selectWallet(wallet: Wallet) {
    this.transaction.toAddress = wallet.address;
    this.selectedSendTo = wallet;
    $("#modalWallets").removeClass("show");
    $("#modalWallets").hide();
    $("body").removeClass("modal-open");
    $(".modal-backdrop").remove();
  }

  async startQR(field: any) {
    // address is the id of the field that will be filled after a successful scan
    $("#iQR").attr("src", "qr/qrcode/index.html?" + field);
  }

  async stopQR() {
    $("#iQR").attr("src", "");
  }

  async sendPaymentToday() {
    this.response = await this._wallet.sendPayment({
      FromAddress: this.transaction.fromAddress,
      ToAddress: this.transaction.toAddress.replace(/[\s]/g, ""),
      Amount: this.getAmountPayment(),
      UserKey: this.transaction.password,
      code: this.transaction.code
    });
  }

  async sendPaymentLater() {
    this.response = await this._shared.post(
      "api/ScheduledPayments/CreateScheduled",
      {
        FromAddress: this.transaction.fromAddress,
        ToAddress: this.transaction.toAddress.replace(/[\s]/g, ""),
        Amount: this.transaction.amount,
        UserKey: this.transaction.password,
        code: this.transaction.code,
        DateShipped: new Date(this.transaction.transactionDate).toISOString(),
        Currency: this.ticker
      }
    );
  }

  async sendPaymentRecurring() {
    this.response = await this._shared.post(
      "api/ScheduledPayments/CreateRecurring",
      {
        IdRecurrenceType: this.transaction.recurrenceType,
        FromAddress: this.transaction.fromAddress,
        ToAddress: this.transaction.toAddress.replace(/[\s]/g, ""),
        Amount: this.transaction.amount,
        UserKey: this.transaction.password,
        code: this.transaction.code,
        Label: this.transaction.recurringLabel,
        StartDate: this.transaction.startDate
          ? new Date(this.transaction.startDate).toISOString()
          : "",
        EndDate: this.transaction.endDate
          ? new Date(this.transaction.endDate).toISOString()
          : "",
        Currency: this.ticker
      }
    );
  }

  async sendPayment() {
    if (
      this.currentWallet.isRewards &&
      !confirm(
        "You have selected your Rewards wallet. Do you really want to continue?"
      )
    )
      return;

    this.inProgress = true;
    try {
      switch (this.dateToSend) {
        case "Later":
          await this.sendPaymentLater();
          break;
        case "Recurring":
          await this.sendPaymentRecurring();
          break;
        default:
          await this.sendPaymentToday();
          break;
      }
      if (!_.isUndefined(this.response) && !_.isUndefined(this.response.txid)) {
        if (this.response && !this.response.status) {
          this.response.status === "OK";
        }
        this._shared.sendTo = "";
        this._shared.updateWalletBalance();
        setTimeout(() => {
          this._router.navigate(["/transactions"]);
        }, 3000);
      }
      try {
        this.setDefaultWallet();
      } catch (e) {
        console.error(e);
        this.errorMessage = e.message;
      } finally {
        this.inProgress = false;
      }
    } catch (e) {
      console.error(e);
      this.errorMessage = e.message;
    } finally {
      this.inProgress = false;
    }
  }

  async createOrder() {
    if (
      this.currentWallet.isRewards &&
      !confirm(
        "You have selected your Rewards wallet. Do you really want to continue?"
      )
    )
      return;

    this.inProgress = true;
    try {
      let body = {
        userWebwallet: this.transaction.fromAddress,
        destinationEmail: this.transaction.destinationEmail.replace(
          /[\s]/g,
          ""
        ),
        addressRefunded: this.transaction.fromAddress,
        amountSmart: this.getAmountPayment(true),
        typeSend: this.typeSend,
        phoneNumber: this.transaction.phoneNumber,
        messageToSend: this.messageToSend,
        code: this.transaction.code,
        userKey: this.transaction.password
      };
      this.response = await this._shared.post("api/Wallet/CreateOrder", body);
      if (this.response.status === "ERROR") {
        this.response = Object.assign(this.response, {
          error: { message: this.response.data }
        });
      }
      if (this.response.status === "OK") {
        this.transaction.toAddress = this.response.data.generatedAddress.replace(
          /[\s]/g,
          ""
        );
        this.response = Object.assign(this.response, { isValid: true });
        this.sendPayment();
      }
      try {
        this.setDefaultWallet();
      } catch (e) {
        this.errorMessage = e.message;
      } finally {
        this.inProgress = false;
      }
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.inProgress = false;
    }
  }

  async getContacts() {
    this.inProgress = true;
    try {
      this.contacts = await this._shared
        .get("api/Contact/Get")
        .then(response => {
          return ContactResponse.map(response.data);
        })
        .catch(function(e) {
          console.log(e);
        });
    } catch (e) {
      console.log(e);
      this.errorMessage = e.message;
    } finally {
      this.inProgress = false;
    }
  }

  listContacts() {
    let contacts: any;

    switch (this.typeSend) {
      case "ADDRESS":
        contacts = this.contacts;
        break;
      case "EMAIL":
        contacts = this.contacts.filter(
          (contact: any) => contact.email !== null
        );
        break;
      case "SMS":
        contacts = this.contacts.filter(
          (contact: any) => contact.phone !== null
        );
        break;
    }

    return contacts;
  }

  async getRecurrenceTypes() {
    const urlApi = "api/ScheduledPayments/GetRecurrenceTypes";
    await this._shared
      .get(urlApi)
      .then((data: any) => (this.recurrencetypes = data.data));
  }

  toggleSendTo() {
    let contact: any;
    let wallet: any;

    switch (this.typeSend) {
      case "ADDRESS":
        contact = _.find(this.contacts, {
          address: this.transaction.toAddress
        });
        wallet = _.find(this._shared.wallet, {
          address: this.transaction.toAddress
        });
        break;
      case "EMAIL":
        contact = _.find(this.contacts, {
          email: this.transaction.destinationEmail
        });
        break;
      case "SMS":
        contact = _.find(this.contacts, {
          phone: this.transaction.phoneNumber
        });
        break;
    }

    if (contact) {
      this.selectedSendTo = contact;
      return;
    }
    if (wallet) {
      this.selectedSendTo = wallet;
      return;
    }
    this.selectedSendTo = null;
  }

  getWallets() {
    return this._shared.wallet;
  }

  getWalletsWithoutVault() {
    return this._shared.wallet.filter(
      (wallet: Wallet) => !wallet.isVault && !wallet.isScheduled
    );
  }
}
