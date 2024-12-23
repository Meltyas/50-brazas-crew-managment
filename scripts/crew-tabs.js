import {
  addCrewMembers,
  decreasePay,
  fetchCrewData,
  increasePay,
  removeCrewMember,
  renderCrewList,
  validateCrewList,
} from "./crew-admin.js";

import { activatePaymentListeners } from "./crew-pay.js";

import { calculateAndDistributePay, printPayToChat } from "./crew-pay.js";

import {
  addCaster,
  addHelpers,
  addNavigator,
  crewBoatingCheck,
  removeCaster,
  removeHelper,
  removeNavigator,
  renderNavigationRoles,
} from "./crew-navigation.js";

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
    html.find(".tab-button").click(async (event) => {
      await validateCrewList();
      const { crewList, crewNumber, boatPay } = await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay);
      renderNavigationRoles();

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
      await validateCrewList();

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

    // Navigation role buttons
    html.find("#add-navigator").click(async () => {
      await addNavigator();
      const { crewList, crewNumber, boatPay, navigation } =
        await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay, navigation);
    });

    html.find("#add-spellcaster").click(async () => {
      await addCaster();
      const { crewList, crewNumber, boatPay, navigation } =
        await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay, navigation);
    });

    html.find("#add-helper").click(async () => {
      await addHelpers();
      const { crewList, crewNumber, boatPay, navigation } =
        await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay, navigation);
    });
    // Remove Navigator
    html.on("click", "#remove-navigator", async (event) => {
      const index = $(event.currentTarget).closest(".navigator").data("index");
      await removeNavigator(index);
      const { crewList, crewNumber, boatPay, navigation } =
        await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay, navigation);
    });

    // Remove Spellcaster
    html.on("click", "#remove-spellcaster", async (event) => {
      const index = $(event.currentTarget)
        .closest(".spellcaster")
        .data("index");
      await removeCaster(index);
      const { crewList, crewNumber, boatPay, navigation } =
        await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay, navigation);
    });

    // Remove Helper
    html.on("click", "#remove-helper", async (event) => {
      const index = $(event.currentTarget)
        .closest(".role-member")
        .data("index");
      console.log(index);
      await removeHelper(index);
      const { crewList, crewNumber, boatPay, navigation } =
        await fetchCrewData();
      renderCrewList(html, crewList, crewNumber, boatPay, navigation);
    });

    html.on("click", "#navigate-button", async (event) => {
      event.preventDefault();
      await crewBoatingCheck();
    });

    // Boat Stats Input Change Handlers
    html.find("#boat-handling").on("input", (event) => {
      const boatHandling = parseFloat(event.target.value);
      if (isNaN(boatHandling)) {
        ui.notifications.warn("Please enter a valid number for Boat Handling.");
        return;
      }
      // Handle boatHandling change logic here
      console.log("Boat Handling:", boatHandling);
    });

    html.find("#boat-movement").on("input", (event) => {
      const boatMovement = parseFloat(event.target.value);
      if (isNaN(boatMovement)) {
        ui.notifications.warn("Please enter a valid number for Boat Movement.");
        return;
      }
      // Handle boatMovement change logic here
      console.log("Boat Movement:", boatMovement);
    });

    html.find("#handling-mod").on("input", (event) => {
      const handlingMod = parseFloat(event.target.value);
      if (isNaN(handlingMod)) {
        ui.notifications.warn("Please enter a valid number for Handling Mod.");
        return;
      }
      // Handle handlingMod change logic here
      console.log("Handling Mod:", handlingMod);
    });

    const consumeResource = game.settings.get(
      "crew-manager",
      "consumeResource"
    );
    html.find("#consume-resource").prop("checked", consumeResource);

    html.find("#consume-resource").change(async (event) => {
      const isChecked = event.target.checked;
      await game.settings.set("crew-manager", "consumeResource", isChecked);
      ui.notifications.info(`Consume Resource setting updated: ${isChecked}`);
    });

    // Initial Render
    const { crewList, crewNumber, boatPay, navigation } = await fetchCrewData();
    renderCrewList(html, crewList, crewNumber, boatPay, navigation);
  }
}
