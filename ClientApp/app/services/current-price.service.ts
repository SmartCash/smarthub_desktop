import { BaseLocalStorageService } from './base-localstore.service';
import { SharedService } from './shared-service.service';
import { Injectable, Inject } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Util } from "../models/util";

@Injectable()
export class CurrentPriceService {
  constructor(protected baseStorage: BaseLocalStorageService, private _shared: SharedService, @Inject('BASE_URL') public baseUrl: string) {
  }

  async getObservableServerCurrentPrice() {
    if (!Util.isValidObject(this._shared.dataStore.currentPrice)) {
      let url = `${this.baseUrl}api/wallet/getcurrentprice`;
      this._shared.dataStore.currentPrice = await
        this._shared.http
          .get(url)
          .map((res) => {
            var json = res.json();
            var model = [{
              price_usd: json.smartcash.usd.toString(),
              price_btc: json.smartcash.btc.toString(),
            }];

            this._shared.dataStore.currentPrice = model;
            return model;
          }).toPromise();
    }
    return this._shared.dataStore.currentPrice;
  }

  async getCurrentPriceInExchange(currency = 'usd,btc') {
    let url = `${this.baseUrl}api/wallet/getcurrentprice?currencies=${currency}`;

    return await new Promise<any>((resolve, reject) => {
      $.get(url).done((data) => {
        resolve(data);
      }).fail((err) => {
        reject(err);
      });
    });
  }

  async getListCurrencies() {
    let url = `${this.baseUrl}api/wallet/getcurrentlist`;

    return await new Promise<number>((resolve, reject) => {
      $.get(url).done((data) => {
        resolve(data);
      }).fail((err) => {
        reject(err);
      });
    });
  }
}