import CrewManagerApp from "./crew-tabs.js";

Hooks.once("init", () => {
  console.log("Crew Manager | Initializing Crew Manager Module");
});

Hooks.once("ready", () => {
  game.settings.register("crew-manager", "crewData", {
    name: "Crew Data",
    hint: "Stores crew management data.",
    scope: "world",
    config: false,
    type: Object,
    default: { crewList: [], crewNumber: 0, boatPay: 2 },
  });

  // Get current settings
  let currentData = game.settings.get("crew-manager", "crewData");

  // Check and set default values if missing
  if (!currentData.crewList) currentData.crewList = [];
  if (!currentData.crewNumber) currentData.crewNumber = 0;
  if (!currentData.boatPay) currentData.boatPay = 2;

  // Save updated settings
  game.settings.set("crew-manager", "crewData", currentData);
});

// Add the Crew Manager button to the Scene Controls
Hooks.on("getSceneControlButtons", (controls) => {
  const targetGroup = controls.find((control) => control.name === "token");

  if (targetGroup) {
    targetGroup.tools.push({
      name: "crew-manager-tabs",
      title: "Crew Manager",
      icon: "fas fa-users",
      onClick: () => {
        const app = new CrewManagerApp();
        app.render(true);
      },
      button: true,
    });

    console.log("Crew Manager | Button added to Token Controls.");
  } else {
    console.error("Crew Manager | Target group not found.");
  }
});
console.log(
  "Template Path: ",
  "modules/crew-manager/templates/crew-manager-tabs.html"
);
