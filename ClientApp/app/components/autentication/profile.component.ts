import { UserRequest } from '../../models/request/user.request.model';
import { Util } from '../../models/util';
import { UserService } from '../../services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { RecoveryKey } from '../../models/response/key-response.model';
import { SharedService } from '../../services/shared-service.service';
import { WalletService } from '../../services/wallet.service';
import { TokenRequest } from '../../models/request/token-request.model';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html'
})

export class ProfileComponent implements OnInit {
    public sending: boolean = false;
    public errorMessage = "";
    public createResponse: any;

    _inProgress: boolean = false;
    get inProgress(): boolean {
        return this._inProgress;
    }
    set inProgress(value: boolean) {
        this._inProgress = value;
    }

    public userInfo: UserRequest = new UserRequest;

    constructor(
        public _userService: UserService,
        private _router: Router,
        public _shared: SharedService,
        public _wallet: WalletService,
        public _route: ActivatedRoute
    ) {
        this.userInfo.email = this._shared.user.email;
        this.userInfo.firstName = this._shared.user.firstName;
        this.userInfo.lastName = this._shared.user.lastName;
        this.userInfo.userKey = '';
    }

    async ngOnInit() {
    }

    async onSubmit() {
        await this.register();
    }

    async register() {
        this.inProgress = true;

        try {
            this.userInfo.termsVersion = this._shared.recoveryKey.termsVersion;
            this.createResponse = await this._userService.updateUser(this.userInfo);
            await this._userService.getUser(this.userInfo);

            setTimeout(() => {
                if (!this.createResponse.isValid) {
                    return;
                }
                this._shared.logout();
                this._router.navigate(['/login']);
            }, 2000);
        }
        catch (e) {
            console.log(this.createResponse);
        }
        finally {
            this.inProgress = false;
        }
    }
}