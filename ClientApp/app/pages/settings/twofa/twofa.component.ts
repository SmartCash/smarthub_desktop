import { TwoFaRequest } from "../../../models/request/twofa.model";
import { Component, Inject, ViewChild, ElementRef } from "@angular/core";
import { SharedService } from "../../../services/shared-service.service";
import { UserService } from "../../../services/user.service";
import { Util } from "../../../models/util";

@Component({
  selector: "settings-twofa",
  templateUrl: "./twofa.component.html"
})
export class TwoFaComponent {
  response: any;
  response2: any;
  response3: any;
  response4: any;
  successMessage = "";
  errorMessage = "";
  twofa: TwoFaRequest = new TwoFaRequest();
  openFormTwoFa: boolean = false;
  showForm: boolean = false;
  showFormRequire2faToSend = false;
  @ViewChild("btnSubmit", { read: ElementRef })
  private btnSubmit: ElementRef;

  _inProgress: boolean = false;
  get inProgress(): boolean {
    return this._inProgress;
  }

  set inProgress(value: boolean) {
    this._inProgress = value;
  }

  constructor(
    @Inject("BASE_URL") public baseUrl: string,
    public _user: UserService,
    public _shared: SharedService
  ) {}

  async enableTwoFa() {
    Util.setButtonAsWaitState(this.btnSubmit);
    this.inProgress = true;
    this.response = undefined;
    this.response2 = undefined;
    this.response3 = undefined;
    this.response4 = undefined;
    this.openFormTwoFa = false;

    try {
      this.response2 = await this._user.enableTwoFa(this.twofa);
      if (this.response2.isValid) {
        this._shared.dataStore.user.is2FAEnabled = true;
        this.twofa = new TwoFaRequest();
        this.openFormTwoFa = false;
      }
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.inProgress = false;
      Util.setButtonAsReadyState(this.btnSubmit);
    }
  }

  _showFormRequire2faToSend() {
    this.showFormRequire2faToSend = true;
    this.response4 = undefined;
  }

  async toggleRequire2faToSend() {
    try {
      Util.setButtonAsWaitState(this.btnSubmit);
      this.inProgress = true;
      this.response4 = undefined;
      const body = {
        code: this.twofa.data,
        require2faToSend: !this._shared.dataStore.user.require2faToSend
      };
      this.response4 = await this._user.require2faToSend(body);
      if (this.response4.isValid) {
        this._shared.dataStore.user.require2faToSend = !this._shared.dataStore
          .user.require2faToSend;
        this.twofa = new TwoFaRequest();
        this.showFormRequire2faToSend = false;
      }
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.inProgress = false;
      Util.setButtonAsReadyState(this.btnSubmit);
    }
  }

  async disableTwoFa() {
    Util.setButtonAsWaitState(this.btnSubmit);
    this.inProgress = true;
    this.response = undefined;
    this.response2 = undefined;
    this.response3 = undefined;
    this.response4 = undefined;
    this.openFormTwoFa = true;

    try {
      this.response3 = await this._user.disableTwoFa(this.twofa);
      if (this.response3.isValid) {
        this._shared.dataStore.user.is2FAEnabled = false;
        this.twofa = new TwoFaRequest();
        this.openFormTwoFa = false;
      }
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      Util.setButtonAsReadyState(this.btnSubmit);
      this.inProgress = false;
    }
  }

  async getNewTwoFa() {
    this.inProgress = true;
    this.response = undefined;
    this.response2 = undefined;
    this.response3 = undefined;
    this.response4 = undefined;
    this.openFormTwoFa = false;
    try {
      this.response = await this._user.getNewTwoFa();
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.inProgress = false;
    }
  }

  async openFormDisableTwoFa() {
    this.openFormTwoFa = true;
    this.response = undefined;
    this.response2 = undefined;
    this.response3 = undefined;
    this.response4 = undefined;
  }
}
