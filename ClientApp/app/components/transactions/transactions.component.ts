import { CurrentPriceService } from "../../services/current-price.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Util } from "../../models/util";
import { SharedService } from "../../services/shared-service.service";
import { Wallet } from "../../models/data/walletv2.data.model";
import * as _ from "lodash";
import { SpinnerService } from "../../services/spinner.service";

@Component({
  selector: "transactions",
  templateUrl: "./transactions.component.html"
})
export class TransactionsComponent implements OnInit, OnDestroy {
  currentPrice: any;
  walletIndex: number = 0;
  _listFilter: string = "";
  currentWallet: Wallet;
  showWallets: boolean = false;
  filterScheduled: string = "Transactions";
  filters: string[] = ["All Transactions", "Received", "Awaiting", "Paid"];
  filterType: string = this.filters[0];
  _transactions: any;
  transactionsTimer: any;

  constructor(
    public _currentPriceService: CurrentPriceService,
    public _shared: SharedService,
    public _spinner: SpinnerService
  ) {}

  async ngOnInit() {
    this.currentPrice = await this._currentPriceService.getObservableServerCurrentPrice()!;

    if (!Util.isValidObject(this.currentWallet)) {
      this.setWallet(this._shared.wallet[0], 0);
    }
  }

  ngOnDestroy() {
    this.clearIntervalTransaction();
  }

  setWallet(wallet: Wallet, index?: number) {
    this.currentWallet = wallet;
    this.walletIndex = index || 0;
    this.showWallets = false;
    this._transactions = [];
    this.getTransactionsFromAddress();
  }

  clearIntervalTransaction() {
    clearInterval(this.transactionsTimer);
  }

  getTransactionsFromAddress(pageNumber = 0) {
    const getTransaction = async () => {
      try {
        this._spinner.showSpinner();
        this._transactions = await this._shared.get(
          `api/wallet/txs/${this.currentWallet.address}/${pageNumber}`
        );
        this._shared.updateWalletBalance();
      } catch (e) {

      } finally {
        this._spinner.hideSpinner();
      }
    };
    getTransaction();
    this.clearIntervalTransaction();
    this.transactionsTimer = setInterval(getTransaction, 20000);
  }

  getTransactions() {
    switch (this.filterType) {
      case "Received":
        return this._transactions.txs.filter(
          (txs: any) =>
            !txs.vin.find((vin: any) => vin.addr === this.currentWallet.address)
        );
      case "Awaiting":
        return this._transactions.txs.filter(
          (txs: any) => txs.confirmations === 0
        );
      case "Paid":
        return this._transactions.txs.filter((txs: any) =>
          txs.vin.find((vin: any) => vin.addr === this.currentWallet.address)
        );
      default:
        return this._transactions.txs;
    }
  }

  direction(transaction: any) {
    return transaction.vin.find(
      (vin: any) => vin.addr === this.currentWallet.address
    )
      ? "Sent"
      : "Received";
  }

  toggleViewer(event: any) {
    event.target.classList.toggle("active");
    event.target.parentNode.nextElementSibling.classList.toggle("active");
  }

  trackByFn(index: any, item: any) {
    return item;
  }

  getSentAmount(outputs: any) {
    let sent = 0.0;
    for (let i = 0; i < outputs.length; i++) {
      let output = outputs[i];
      if (
        output.scriptPubKey.addresses &&
        !output.scriptPubKey.addresses.includes(this.currentWallet.address)
      ) {
        sent += parseFloat(output.value);
      }
    }
    return sent;
  }

  getReceivedAmount(outputs: any) {
    let received = 0.0;
    for (let i = 0; i < outputs.length; i++) {
      let output = outputs[i];
      if (
        output.scriptPubKey.addresses &&
        output.scriptPubKey.addresses.includes(this.currentWallet.address)
      ) {
        received += parseFloat(output.value);
      }
    }
    return received;
  }

  getAmount(transaction: any): number {
    let direction = this.direction(transaction);
    if (direction == "Received") {
      return this.getReceivedAmount(transaction.vout);
    }
    return this.getSentAmount(transaction.vout);
  }
}
