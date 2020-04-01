import { Router, ActivatedRoute, RouterStateSnapshot } from "@angular/router";
import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ElementRef,
  ViewChild
} from "@angular/core";
import { SharedService } from "../../services/shared-service.service";
import { UserService } from "../../services/user.service";
import { TokenRequest } from "../../models/request/token-request.model";
import { WalletService } from "../../services/wallet.service";
import { Util } from "../../models/util";
import { BaseLocalStorageService } from "../../services/base-localstore.service";
import { DeviceDetectorService } from "../../modules/ngx-device-detector/device-detector.service";
import { isPlatformBrowser } from "@angular/common";
import { environment } from "../../app.environment";

@Component({
  selector: "login",
  styleUrls: ['./login.component.css'],
  templateUrl: "./login.component.html"
})
export class LoginComponent implements OnInit {
  public _env = environment;
  @ViewChild("btnSubmit", { read: ElementRef })
  private btnSubmit: ElementRef;

  constructor(
    public _shared: SharedService,
    public _router: Router,
    public _user: UserService,
    public _wallet: WalletService,
    private _route: ActivatedRoute,
    @Inject("BASE_URL") public baseUrl: string,
    @Inject(PLATFORM_ID) platformId: Object,
    private _baseStorage: BaseLocalStorageService,
    private _device: DeviceDetectorService
  ) {
    if (Util.isValidObject(this._shared.isAuthenticated))
      this.inProgress = true;
    this.userInfo = new TokenRequest();
    this.redirectIfAuthenticated();

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
  }

  public userInfo: TokenRequest;
  public isNative = false;
  public isMobile = false;
  public formModel = { captcha: undefined };

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

  ErrorMessage: string = "";

  async login() {
    Util.setButtonAsWaitState(this.btnSubmit);
    this.inProgress = true;
    try {
      await this._user.getUserToken(this.userInfo);
      if (this._shared.isTokenValid) {
        await this.setIsAuthenticated();
        this.redirectIfAuthenticated();
      }
      if (!this._shared.isAuthenticated && this._shared.token.error !== null) {
        this.ErrorMessage = this._shared.token.error_description;
        grecaptcha.reset();
      }
    } catch (e) {
      grecaptcha.reset();
      this.ErrorMessage = "Invalid user or password";
    } finally {
      this.inProgress = false;
      Util.setButtonAsReadyState(this.btnSubmit);
    }
  }

  async autoLogin() {
    //TODO: Get from local DB
    this.inProgress = true;
    await this._user.getUser(this.userInfo);
    await this._shared.updateWalletBalance();
    if (!Util.isValidObject(this._shared.user)) {
      this._shared.logout();
    }
    this.inProgress = false;
  }

  public getClientTokenCacheName = `${this.baseUrl}api/Login/GetClientToken`;

  async redirectIfAuthenticated() {
    let item = this._baseStorage.getItemWithoutTime(
      this.getClientTokenCacheName
    );
    this._shared.dataStore.isAuthenticated =
      Util.isValidObject(item) && Util.isValidObject(item.access_token);
    this._shared.dataStore.token = item;

    if (this._shared.isAuthenticated) {
      await this.autoLogin();
      let param = this._route.snapshot.queryParams["returnUrl"];
      if (param == "/home" || param == "home") param = "/overview";
      let returnUrl = param || "/overview";
      this._router.navigate([returnUrl]);
    }
  }

  public ngOnInit(): void {
    this.isNative = /AppName\/[0-9\.]+$/.test((<any>navigator).userAgent);
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(
      (<any>navigator).userAgent
    );
    let isExpired = this._baseStorage.getItemWithoutTime(
      this.getClientTokenCacheName
    );

    this._shared.dataStore.isAuthenticated =
      Util.isValidObject(isExpired) &&
      Util.isValidObject(isExpired.access_token);

    if (isExpired == null) {
      this._shared.logout();
      let param = this._route.snapshot.queryParams["returnUrl"];
      this._router.navigate(["/login"], { queryParams: { returnUrl: param } });
    }

    if (Util.isValidObject(this._shared.isAuthenticated))
      this.inProgress = true;
  }

  private async setIsAuthenticated() {
    this._shared.dataStore.isAuthenticated = this._shared.isTokenValid;
  }

  resolved(captchaResponse: string) {
    this.userInfo.responseRecaptcha = captchaResponse;
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
