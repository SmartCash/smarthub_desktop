import { Component, Inject } from "@angular/core";
import { SharedService } from "../../services/shared-service.service";

@Component({
  selector: "settings",
  templateUrl: "./settings.component.html"
})
export class SettingsComponent {
  constructor(
    public _shared: SharedService,
    @Inject("BASE_URL") public baseUrl: string
  ) {}
}
