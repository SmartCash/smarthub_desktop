import { Util } from '../models/util';
import { TokenRequest } from '../models/request/token-request.model';
import { TokenResponse } from '../models/response/token-response.model';
import { RecoveryKey } from '../models/response/key-response.model';
import { UserRequest } from '../models/request/user.request.model';
import { SharedService } from './shared-service.service';
import { Injectable, Inject } from '@angular/core';
import { Http, Response } from '@angular/http';
import { User } from "../models/user.model";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Wallet } from '../models/data/walletv2.data.model';
import { SpinnerService } from './spinner.service';

@Injectable()
export class UserService {
    public getClientTokenCacheName = `${this.baseUrl}api/Login/GetClientToken`;
    public getInfoWithKeyCacheName = `${this.baseUrl}api/User/GetInfoWithKey`;
    public geoIpLookup: any;

    constructor(
        public spinnerService: SpinnerService,
        protected _shared: SharedService,
        @Inject('BASE_URL') public baseUrl: string,
        protected _http: Http,

    ) {
    }

    async getNewkey() {
        this.spinnerService.showSpinner();
        return await this._shared.http.get(`${this.baseUrl}api/User/GetNewKey`)
            .map((response: Response) => { return response.json(); })
            .toPromise()
            .then(response => {
                this.spinnerService.hideSpinner();
                this._shared.dataStore.recoveryKey = RecoveryKey.map(response.data);
                return this._shared.dataStore.recoveryKey;
            }).catch(function (e) {
                console.log(e);
            });
    }

    async createUser(user: UserRequest) {
        return await
            this._shared.http.post(`${this.baseUrl}api/User/CreateUser`, user)
                .map((response: Response) => { return response.json(); })
                .toPromise()
                .then(response => {
                    this._shared.dataStore.user = User.map(response.data);

                    let r = {
                        "error": response.error,
                        "status": response.status,
                        "isValid": response.isValid,
                        "data": this._shared.dataStore.user
                    };

                    return r;
                }).catch(function (e) {
                    console.log(e);
                });
    }

    async updateUser(user: UserRequest) {
        return await
            this._shared.put(`api/User/UpdateUser`, user)
                .then(response => {
                    this._shared.dataStore.user = User.map(response.data);

                    let r = {
                        "error": response.error,
                        "status": response.status,
                        "isValid": response.isValid,
                        "data": this._shared.dataStore.user
                    };

                    return r;
                }).catch(function (e) {
                    console.log(e);
                });
    }

    async getUserToken(user: TokenRequest) {
        let tokenFromCache = await this._shared.cacheGetWithoutTime(this.getClientTokenCacheName);

        if (Util.isValidObject(tokenFromCache)) {
            let tokenFromCachePromise = await tokenFromCache.toPromise();
            this._shared.dataStore.isAuthenticated = Util.isValidObject(tokenFromCachePromise);

            if (this._shared.dataStore.isAuthenticated) {
                this._shared.dataStore.token = tokenFromCachePromise;
                return this._shared.dataStore.token;
            }
        }
        return await
            this._shared.http.post(this.getClientTokenCacheName, user)
                .map<Response, TokenResponse>((res: Response) => {

                    return TokenResponse.map(res.json());
                })
                .toPromise<TokenResponse>()
                .then(data => {
                    this._shared.dataStore.token = data
                    if (Util.isValidObject(this._shared.dataStore.token) && Util.isValidObject(this._shared.dataStore.token.access_token)) {
                        this._shared.cacheIt(this._shared.dataStore.token, this.getClientTokenCacheName);
                    }

                    return this._shared.dataStore.token;
                })
                .catch(function (e) {
                    console.log(e);
                });
    }
    async getUser(user: any) {
        let userFromCache = await this._shared.cacheGetWithoutTime(this.getInfoWithKeyCacheName);
        
        if (Util.isValidObject(userFromCache)) {
            let userFromCachePromise = await userFromCache.toPromise();
            this._shared.dataStore.user = User.map(userFromCachePromise);
            this._shared.dataStore.wallet = Wallet.map(userFromCachePromise.wallet);
            return this._shared.dataStore.user;
        }

        return await this._shared.post(`api/User/GetInfoWithKey`, { password: user.password })
            .then(response => {
                this._shared.updateGetInfo(response, user.password);
                return this._shared.dataStore.user;
            }).catch(function (e) {
                console.log(e);
            });
    }
    async getNewTwoFa() {
        return await this._shared.get(`api/User/GetNewTwoFa`)
            .then(response => {
                return response;
            }).catch(function (e) {
                console.log(e);
            });
    }
    async enableTwoFa(data: any) {
        return await this._shared.post(`api/User/EnableTwoFa`, data)
            .then(response => {
                return response;
            }).catch(function (e) {
                console.log(e);
            });
    }
    async disableTwoFa(data: any) {
        return await this._shared.post(`api/User/DisableTwoFa`, data)
            .then(response => {
                return response;
            }).catch(function (e) {
                console.log(e);
            });
    }

    async disableTwoFaRecovery(data: any) {
        return await this._shared.post2('api/User/DisableTwoFaRecovery', data, false)
            .then(response => response)
            .catch(e => console.log(e));
    }

    async changePassword(data: any) {
        return await this._shared.post2(`api/User/PasswordReset`, data, false)
            .then(response => {
                return response;
            }).catch(function (e) {
                console.log(e);
            });
    }
    async getUserByName(username: string, label: string | null): Promise<any> {
        let url: string = `${this.baseUrl}api/User/GetUserByName?username=${username}`;
        if (label) {
            url += `&label=${label}`;
        }
        return await this._http
            .get(url)
            .map((res: any) => {
                return res.json();
            }).toPromise();
    }

    async require2faToSend(data: any) {
        return await this._shared.post(`api/User/Require2faToSend`, data)
            .then(response => {
                return response;
            }).catch(function (e) {
                console.log(e);
            });
    }
}