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
import Swal from "sweetalert2";
import { PrivateKeysGenerator } from '../register/privatekeys.generator';

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
      Swal({
        type: "success",
        text: "Your account has been created, confirm to download your Master Security Code",
        customClass: "animated fadeInDown",
        showConfirmButton: true,
        allowOutsideClick: false,
        heightAuto: false
      }).then(() => {
        PrivateKeysGenerator.generate(null, this.userInfo.username, this.userInfo.recoveryKey);
        this._router.navigate(["/login"]);
      });
    } else {
      this.userInfo.termsVersion = null!;
    }

    Util.setButtonAsReadyState(this.btnSubmit);
    this.sending = false;
    this.sendButtonText = this.sendText;
  }

  resolved(captchaResponse: string) {
    this.userInfo.responseRecaptcha = captchaResponse;
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
