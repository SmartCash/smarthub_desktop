import { WalletService } from "../../../services/wallet.service";
import { ImportRequest } from "../../../models/request/import-request.model";
import { Component, Inject, OnInit, PLATFORM_ID, ViewChild, ElementRef } from "@angular/core";
import { Util } from "../../../models/util";
import { DeviceDetectorService } from "../../../modules/ngx-device-detector/device-detector.service";
import { SharedService } from "../../../services/shared-service.service";
import { isPlatformBrowser } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";

@Component({
  selector: "settings-import",
  templateUrl: "./import.component.html"
})
export class SettingsImportComponent implements OnInit {
  import: ImportRequest;
  response: any;
  successMessage = "";
  errorMessage = "";
  showForm: boolean = false;
  @ViewChild("btnSubmit", { read: ElementRef })
  private btnSubmit: ElementRef;

  _inProgress: boolean = false;
  get inProgress(): boolean {
    return this._inProgress;
  }

  set inProgress(value: boolean) {
    this._inProgress = value;
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
    public _walletService: WalletService,
    private _router: Router,
    @Inject("BASE_URL") public baseUrl: string,
    private route: ActivatedRoute,
    private _device: DeviceDetectorService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.import = new ImportRequest();

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

  private timer: any;
  ngOnInit(): void {
    this.timer = setInterval(() => {
      let fieldValue = $("#privateKey").val();
      if (
        Util.isValidAndNotEmpty(fieldValue) &&
        this.import.privateKey !== fieldValue
      ) {
        this.import.privateKey = fieldValue!.toString();
        console.log(this.import.privateKey);
      }
    }, 500);
  }

  async onSubmit() {
    Util.setButtonAsWaitState(this.btnSubmit);
    this.inProgress = true;
    try {
      this.response = await this._walletService.importWallet(this.import);
      await this._walletService.getWallet();
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      Util.setButtonAsReadyState(this.btnSubmit);
      this.inProgress = false;
    }
  }

  async startQR() {
    // privateKey is the id of the field that will be filled after a successful scan
    $("#iQR").attr("src", "qr/qrcode/index.html?privateKey");
  }

  async stopQR() {
    $("#iQR").attr("src", "");
  }
}
