import {
  addCrewMembers,
  decreasePay,
  fetchCrewData,
  increasePay,
  removeCrewMember,
  renderCrewList,
} from "./crew-admin.js";

import { activatePaymentListeners } from "./crew-pay.js";

import { calculateAndDistributePay, printPayToChat } from "./crew-pay.js";

export default class CrewManagerApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "crew-manager-app",
      title: "Crew Manager",
      template: "modules/50-brazas-crew-managment/templates/crew-tabs.html",
      width: 500,
      height: 500,
      resizable: true,
      minimizable: true,
    });
  }

  async activateListeners(html) {
    super.activateListeners(html);

    html.on("click", "#make-payment-button", async (event) => {
      event.preventDefault();
      activatePaymentListeners(html);
    });

    // Default Tab Selection
    html.find(".tab-content").hide(); // Hide all tabs initially
    html.find("#crew-management-tab").show(); // Show the Crew Management tab by default
    html.find(".tab-button[data-tab='crew-management-tab']").addClass("active"); // Set the Crew Management tab button as active

    // Tab Switching with Animation
    html.find(".tab-button").click((event) => {
      const tab = $(event.currentTarget).data("tab");
      const targetTab = html.find(`#${tab}`);
      console.log(targetTab);

      if (targetTab.length) {
        // Animate fading out of the current tab
        html.find(".tab-content:visible").fadeOut(200, () => {
          // Once fade out is complete, show the selected tab
          targetTab.fadeIn(200);
        });

        // Update the active button
        html.find(".tab-button").removeClass("active");
        $(event.currentTarget).addClass("active");
      }
    });

    // Crew Management Buttons
    html.find("#add-crew-members").click(async () => {
      await addCrewMembers();
      const { crewList, crewNumber, boatPay } = await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay);
    });

    html.on("click", ".btn-remove", async (event) => {
      const index = $(event.currentTarget)
        .closest(".crew-member")
        .data("index");
      await removeCrewMember(index);
      const { crewList, crewNumber, boatPay } = await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay);
    });

    html.on("click", ".btn-increase", async (event) => {
      const index = $(event.currentTarget)
        .closest(".crew-member")
        .data("index");
      await increasePay(index);
      const { crewList, crewNumber, boatPay } = await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay);
    });

    html.on("click", ".btn-decrease", async (event) => {
      const index = $(event.currentTarget)
        .closest(".crew-member")
        .data("index");
      await decreasePay(index);
      const { crewList, crewNumber, boatPay } = await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay);
    });

    // Pay Splitting Functionality
    html.find("#split-pay").click(async () => {
      const totalPay = parseFloat(html.find("#total-pay-input").val());
      if (isNaN(totalPay) || totalPay <= 0) {
        ui.notifications.warn("Please enter a valid total amount to split.");
        return;
      }
      await calculateAndDistributePay(html, totalPay);
    });

    html.find("#print-to-chat").click(async () => {
      const totalPay = parseFloat(html.find("#total-pay-input").val());
      console.log("totalPay", totalPay);
      if (isNaN(totalPay) || totalPay <= 0) {
        ui.notifications.warn(
          "Please enter a valid total amount to split before printing to chat."
        );
        return;
      }
      await printPayToChat(totalPay);
    });

    // Initial Render
    const { crewList, crewNumber, boatPay } = await fetchCrewData();
    renderCrewList(html, crewList, crewNumber, boatPay);
  }
}
