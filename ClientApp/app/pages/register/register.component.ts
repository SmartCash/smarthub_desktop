import { UserRequest } from "../../models/request/user.request.model";
import { Util } from "../../models/util";
import { UserService } from "../../services/user.service";
import { Router } from "@angular/router";
import {
  Component,
  OnInit,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef
} from "@angular/core";
import { SharedService } from "../../services/shared-service.service";
import { WalletService } from "../../services/wallet.service";
import { TokenRequest } from "../../models/request/token-request.model";
import * as jQuery from "jquery";
import { DeviceDetectorService } from "../../modules/ngx-device-detector/device-detector.service";
import { isPlatformBrowser } from "@angular/common";
import { environment } from "../../app.environment";
import { SpinnerService } from "../../services/spinner.service";

@Component({
  selector: "register",
  styleUrls: ["./register.component.css"],
  templateUrl: "./register.component.html"
})
export class RegisterComponent implements OnInit {
  isCopied1: boolean = false;
  public sending: boolean = false;
  public sendText: string = "Send";
  public sendingText: string = "Sending...";
  public sendButtonText = this.sendText;
  public errorMessage = "asdasd";
  public createResponse: any;
  public showInfoPanel: boolean = false;
  public export: any;
  public showTerms: boolean = false;
  public formModel = { captcha: undefined };
  public isNative = false;
  public isMobile = false;
  public _env = environment;
  public codeConfirmKey: boolean = false;
  @ViewChild("btnSubmit", { read: ElementRef })
  private btnSubmit: ElementRef;

  _hasQrCode: boolean = true;
  get hasQrCode(): boolean {
    return this._hasQrCode;
  }
  set hasQrCode(value: boolean) {
    this._hasQrCode = value;
  }

  _inProgress: boolean = false;
  get inProgress(): boolean {
    return this._inProgress;
  }
  set inProgress(value: boolean) {
    this._inProgress = value;
  }

  _isPasswordEqual: boolean = true;
  get isPasswordEqual(): boolean {
    return this._isPasswordEqual;
  }
  set isPasswordEqual(value: boolean) {
    this._isPasswordEqual = value;
  }

  _isRecoveryKeyEqual: boolean = true;
  get isRecoveryKeyEqual(): boolean {
    return this._isRecoveryKeyEqual;
  }
  set isRecoveryKeyEqual(value: boolean) {
    this._isRecoveryKeyEqual = value;
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

  public userInfo: UserRequest = new UserRequest();
  public userInfoExtended = { password_confirmation: "", key_confirmation: "" };

  constructor(
    public _spinner: SpinnerService,
    public _userService: UserService,
    private _router: Router,
    public _shared: SharedService,
    public _wallet: WalletService,
    private _device: DeviceDetectorService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    let isPWA;
    if (isPlatformBrowser(platformId)) {
      isPWA = window.matchMedia("(display-mode: standalone)").matches;
    }

    if (isPlatformBrowser(platformId)) {
      this.isNative = /AppName\/[0-9\.]+$/.test((<any>navigator).userAgent);
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(
        (<any>navigator).userAgent
      );
    }

    let browser = _device.getDeviceInfo().browser;
    let lameBrowsers = ["safari"];
    if (lameBrowsers.indexOf(browser) > -1 && isPWA) {
      this.hasQrCode = false;
    }
  }

  ngOnInit() {
    this.inProgress = false;
  }

  generateMSK() {
    this._userService.getNewkey();
  }

  public confirmPassword() {
    this.isPasswordEqual =
      this.userInfo.password === this.userInfoExtended.password_confirmation;
  }

  public confirmKey() {
    this.isRecoveryKeyEqual =
      this._shared.recoveryKey.recoveryKey ===
      this.userInfoExtended.key_confirmation;
    if (
      this._shared.recoveryKey.recoveryKey ===
      this.userInfoExtended.key_confirmation
    ) {
      this.codeConfirmKey = true;
    } else {
      this.codeConfirmKey = false;
    }
  }

  async onSubmit() {
    await this.register();
  }

  async register() {
    this.sending = true;
    this.sendButtonText = this.sendingText;
    this.inProgress = true;
    Util.setButtonAsWaitState(this.btnSubmit);

    this.userInfo.recoveryKey = this._shared.recoveryKey.recoveryKey;
    this.userInfo.termsVersion = this._shared.recoveryKey.termsVersion;
    this.createResponse = await this._userService.createUser(this.userInfo);

    if (this.createResponse.isValid) {
      await this.Login();
    } else {
      this.errorMessage = this.createResponse.error;
      this.userInfo.termsVersion = null!;
    }

    Util.setButtonAsReadyState(this.btnSubmit);
    // this.inProgress = false;
    this.sending = false;
    this.sendButtonText = this.sendText;
  }

  async Login() {
    let token = new TokenRequest();
    token.username = this.userInfo.username;
    token.password = this.userInfo.password;

    await this._userService.getUserToken(token);

    if (this._shared.isTokenValid) {
      await this._userService.getUser(token);

      await this._wallet.getWallet();

      await this.setIsAuthenticated();

      let exportResponse = await this._wallet.exportWallet({
        data: this._shared.recoveryKey.recoveryKey,
        userkey: token.password
      });

      if (Util.isValidObject(exportResponse) && exportResponse.isValid) {
        await this._shared.exportPrivateKeys(
          exportResponse,
          token.username,
          this._shared.recoveryKey.recoveryKey
        );
      }

      let redirect = confirm(
        "Did you save your Master Security Code and your Private Key? Can we redirect you?"
      );

      if (redirect) {
        this.redirectIfAuthenticated();
      } else {
        this.showInfoPanel = true;
      }
    }
  }

  async securityCodeConfirm() {
    this.inProgress = true;
  }

  redirectIfAuthenticated() {
    if (this._shared.isAuthenticated) {
      this._router.navigate(["/overview"]);
    }
  }

  resolved(captchaResponse: string) {
    this.userInfo.responseRecaptcha = captchaResponse;
  }

  private async setIsAuthenticated() {
    this._shared.dataStore.isAuthenticated = this._shared.isTokenValid;
  }

  goToTop() {
    jQuery(".page-register").scrollTop(0);
  }

  async startQR() {
    $("#iQR").attr("src", "qr/qrcode/index.html?password");
  }

  async stopQR() {
    $("#iQR").attr("src", "");
  }

  get recaptchaKey() {
    return environment.recaptchaKey;
  }
}
