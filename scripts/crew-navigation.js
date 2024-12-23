import { fetchCrewData, saveCrewData } from "./crew-admin.js";
export async function addNavigator() {
  const selected = canvas.tokens.controlled;
  if (selected.length === 0) {
    ui.notifications.warn("Please select at least one token to add.");
    return;
  }

  let { crewList, boatPay, navigation } = await fetchCrewData();
  if (!navigation) {
    navigation = {};
  }

  console.log("Before Adding Navigator:", navigation);

  if (navigation.navigator) {
    ui.notifications.warn(
      "There can only be one navigator. Please remove the existing navigator first."
    );
    return;
  }

  const token = selected[0];
  const actor = game.actors.get(token.actor.id);

  if (!actor) {
    ui.notifications.warn(
      `Actor with ID ${token.actor.id} and name ${token.name} not found.`
    );
    return;
  }

  navigation.navigator = {
    id: token.id,
    actorId: token.actor.id,
    name: actor.name,
    image: actor.img,
    role: "navigator",
  };

  console.log("Navigator Added:", navigation.navigator);

  try {
    const clonedNavigation = foundry.utils.deepClone(navigation);
    await saveCrewData(crewList, boatPay, clonedNavigation);

    const updatedData = await game.settings.get("crew-manager", "crewData");
    console.log("After Saving Navigator:", updatedData);

    // Render UI Updates
    await renderNavigationRoles();
    ui.notifications.info(`Navigator "${actor.name}" added successfully.`);
  } catch (error) {
    console.error("Error saving navigator data:", error);
    ui.notifications.error(
      "Failed to add navigator. Check console for details."
    );
  }
}

export async function addCaster() {
  const selected = canvas.tokens.controlled;
  if (selected.length === 0) {
    ui.notifications.warn("Please select at least one token to add.");
    return;
  }

  let { crewList, boatPay, navigation } = await fetchCrewData();
  if (!navigation) {
    navigation = {};
  }

  console.log("Fetched Navigation Data (Before Adding Caster):", navigation);

  // Check if there's already a caster
  if (navigation.caster) {
    ui.notifications.warn(
      "There can only be one caster. Please remove the existing caster first."
    );
    return;
  }

  const token = selected[0];
  const actor = game.actors.get(token.actor.id);

  if (!actor) {
    ui.notifications.warn(
      `Actor with ID ${token.actor.id} with name ${token.name} not found.`
    );
    return;
  }

  navigation.caster = {
    id: token.id,
    actorId: token.actor.id,
    name: actor.name,
    image: actor.img,
    role: "caster",
  };

  console.log("Updated Caster:", navigation.caster);

  // Clone the navigation object to prevent reference issues
  const clonedNavigation = foundry.utils.deepClone(navigation);

  await saveCrewData(crewList, boatPay, clonedNavigation);

  const updatedData = await game.settings.get("crew-manager", "crewData");
  console.log("Updated Crew Data (After Adding Caster):", updatedData);
  await renderNavigationRoles();
}

export async function addHelpers() {
  const selected = canvas.tokens.controlled;
  if (selected.length === 0) {
    ui.notifications.warn("Please select at least one token to add.");
    return;
  }

  let { crewList, boatPay, navigation } = await fetchCrewData();
  if (!navigation) {
    navigation = {};
  }

  console.log("Fetched Navigation Data (Before Adding Helpers):", navigation);

  if (!navigation.helpers) {
    navigation.helpers = [];
  }

  let addedCount = 0;

  selected.forEach((token) => {
    if (!navigation.helpers.some((member) => member.id === token.id)) {
      const actor = game.actors.get(token.actor.id);
      if (!actor) {
        ui.notifications.warn(
          `Actor with ID ${token.actor.id} with name ${token.name} not found. Consider removing that token.`
        );
        return; // Skip this entry if the actor is not found
      }

      navigation.helpers.push({
        id: token.id,
        actorId: token.actor.id,
        name: actor.name,
        image: actor.img,
        role: "helper",
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    console.log("Updated Helpers:", navigation.helpers);

    // Clone the navigation object to prevent reference issues
    const clonedNavigation = foundry.utils.deepClone(navigation);

    await saveCrewData(crewList, boatPay, clonedNavigation);

    const updatedData = await game.settings.get("crew-manager", "crewData");
    await renderNavigationRoles();

    console.log("Updated Crew Data (After Adding Helpers):", updatedData);
    ui.notifications.info(`${addedCount} helper(s) added successfully.`);
  } else {
    ui.notifications.info("No new helpers were added.");
  }
}

export async function renderNavigationRoles() {
  const { navigation } = await fetchCrewData();

  // Render Navigator
  const navigatorSlot = document.getElementById("navigator-slot");
  navigatorSlot.innerHTML = "";
  if (navigation.navigator) {
    const navigatorActor = game.actors.get(navigation.navigator.actorId);
    if (navigatorActor) {
      navigatorSlot.innerHTML = `
      <div class="role-member">
        <img src="${navigatorActor.img}" alt="${navigatorActor.name}" />
        <span>${navigatorActor.name}</span>
      </div>
    `;
    } else {
      console.warn(
        `Navigator actor with ID ${navigation.navigator.actorId} not found.`
      );
      navigatorSlot.innerHTML = `<p class="empty-slot-text">No navigator assigned</p>`;
    }
  }

  // Render Spellcaster
  const spellcasterSlot = document.getElementById("spellcaster-slot");
  spellcasterSlot.innerHTML = "";
  if (navigation.caster) {
    const casterActor = game.actors.get(navigation.caster.actorId);
    if (casterActor) {
      spellcasterSlot.innerHTML = `
      <div class="role-member">
        <img src="${casterActor.img}" alt="${casterActor.name}" />
        <span>${casterActor.name}</span>
      </div>
    `;
    } else {
      console.warn(
        `Caster actor with ID ${navigation.caster.actorId} not found.`
      );
      spellcasterSlot.innerHTML = `<p class="empty-slot-text">No spellcaster assigned</p>`;
    }
  }

  // Render Helpers
  const helpersList = document.getElementById("helpers-list");
  helpersList.innerHTML = "";
  if (navigation.helpers && navigation.helpers.length > 0) {
    navigation.helpers.forEach((helper) => {
      const helperActor = game.actors.get(helper.actorId);
      if (helperActor) {
        helpersList.innerHTML += `
        <div class="role-member">
          <img src="${helperActor.img}" alt="${helperActor.name}" />
          <span>${helperActor.name}</span>
          <button id="remove-helper" class="button">X</button>
        </div>
      `;
      } else {
        console.warn(`Helper actor with ID ${helper.actorId} not found.`);
      }
    });
  } else {
    helpersList.innerHTML = `<p class="empty-slot-text">No helpers assigned</p>`;
  }
}

export async function removeNavigator() {
  let { crewList, boatPay, navigation } = await fetchCrewData();
  if (!navigation || !navigation.navigator) {
    ui.notifications.warn("No navigator to remove.");
    return;
  }

  delete navigation.navigator;

  try {
    const clonedNavigation = foundry.utils.deepClone(navigation);
    await saveCrewData(crewList, boatPay, clonedNavigation);

    const updatedData = await game.settings.get("crew-manager", "crewData");
    console.log("After Removing Navigator:", updatedData);

    await renderNavigationRoles();
    ui.notifications.info("Navigator removed successfully.");
  } catch (error) {
    console.error("Error removing navigator data:", error);
    ui.notifications.error(
      "Failed to remove navigator. Check console for details."
    );
  }
}

export async function removeCaster() {
  let { crewList, boatPay, navigation } = await fetchCrewData();
  if (!navigation || !navigation.caster) {
    ui.notifications.warn("No caster to remove.");
    return;
  }

  delete navigation.caster;

  try {
    const clonedNavigation = foundry.utils.deepClone(navigation);
    await saveCrewData(crewList, boatPay, clonedNavigation);

    const updatedData = await game.settings.get("crew-manager", "crewData");
    console.log("After Removing Caster:", updatedData);

    await renderNavigationRoles();
    ui.notifications.info("Caster removed successfully.");
  } catch (error) {
    console.error("Error removing caster data:", error);
    ui.notifications.error(
      "Failed to remove caster. Check console for details."
    );
  }
}

export async function removeHelper(index) {
  let { crewList, boatPay, navigation } = await fetchCrewData();
  if (!navigation || !navigation.helpers) {
    ui.notifications.warn("No helpers to remove.");
    return;
  }

  if (index < 0 || index >= navigation.helpers.length) {
    ui.notifications.warn("Invalid helper index.");
    return;
  }

  navigation.helpers.splice(index, 1);

  try {
    const clonedNavigation = foundry.utils.deepClone(navigation);
    await saveCrewData(crewList, boatPay, clonedNavigation);

    const updatedData = await game.settings.get("crew-manager", "crewData");
    console.log("After Removing Helper:", updatedData);

    await renderNavigationRoles();
    ui.notifications.info("Helper removed successfully.");
  } catch (error) {
    console.error("Error removing helper data:", error);
    ui.notifications.error(
      "Failed to remove helper. Check console for details."
    );
  }
}

export async function crewBoatingCheck() {
  const { navigation } = await fetchCrewData();
  console.log("roll check", navigation);
  let helpingBonus = 0;
  let navigationExtraMovement = 0;
  const rollDetails = [];
  const finalHandling = navigation.boatHandling + navigation.handlingMod;
  navigationExtraMovement = navigation.boatMovement + navigationExtraMovement;
  console.log(`Boat Handling: ${finalHandling}`);
  console.log(`Boat Movement: ${navigation.boatMovement}`);
  const consumeResource = game.settings.get("crew-manager", "consumeResource");
  let crewData = game.settings.get("crew-manager", "crewData");
  const crewNumber = crewData.crewNumber;

  // Roll for Helpers
  if (navigation.helpers && navigation.helpers.length > 0) {
    for (const helper of navigation.helpers) {
      const actor = game.actors.get(helper.actorId);
      if (!actor) {
        ui.notifications.warn(`Actor with ID ${helper.actorId} not found.`);
        continue;
      }

      // Custom roll formula
      const rollFormula = `{1d10x,1d6x}kh`;
      const roll = await new Roll(rollFormula).evaluate();

      // Display the roll in chat
      const chatData = {
        speaker: ChatMessage.getSpeaker({ actor }),
        rolls: [roll],
        flavor: `Helper Boating Roll`,
      };

      ChatMessage.create(chatData);

      // Calculate helper bonus
      const rollTotal = roll.total;
      let modifier = 0;
      if (rollTotal >= 8) {
        modifier = 2;
      } else if (rollTotal >= 4) {
        modifier = 1;
      } else if (rollTotal <= 3) {
        modifier = -1;
      } else if (rollTotal === 0) {
        modifier = -2;
      }

      helpingBonus += modifier;
      console.log("helpinh", helpingBonus);

      // Add to roll details with type
      rollDetails.push({
        name: actor.name,
        actorId: actor.id,
        rollTotal,
        modifier,
        type: "Boating",
        role: "Helper",
      });
    }

    const consumeResource = game.settings.get(
      "crew-manager",
      "consumeResource"
    );
    if (consumeResource) {
      console.log("Consuming a resource...");
      // Implement your resource consumption logic here
    } else {
      console.log("Resource consumption is disabled.");
    }
  }

  // Roll for Navigator
  if (navigation.navigator) {
    const actor = game.actors.get(navigation.navigator.actorId);
    if (actor) {
      const rollFormula = `{1d10x + ${helpingBonus}}kh`;
      const roll = await new Roll(rollFormula).evaluate();

      // Display the roll in chat
      const chatData = {
        speaker: ChatMessage.getSpeaker({ actor }),
        rolls: [roll],
        flavor: `Navigator Boating Roll`,
      };

      ChatMessage.create(chatData);

      // Calculate navigation bonus
      const rollTotal = roll.total;
      if (rollTotal >= 8) {
        navigationExtraMovement += 1;
      }

      // Add to roll details with type
      rollDetails.push({
        name: actor.name,
        actorId: actor.id,
        rollTotal,
        modifier: helpingBonus,
        type: "Boating",
        role: "Navigator",
      });
    }
  }

  // Roll for Spellcaster
  if (navigation.caster) {
    const actor = game.actors.get(navigation.caster.actorId);
    if (actor) {
      const rollFormula = `1d10x`;
      const roll = await new Roll(rollFormula).evaluate();

      // Display the roll in chat
      const chatData = {
        speaker: ChatMessage.getSpeaker({ actor }),
        rolls: [roll],
        flavor: `Spellcaster Zephyr Roll`,
      };

      ChatMessage.create(chatData);

      // Calculate spellcasting bonus
      const rollTotal = roll.total;
      if (rollTotal >= 8) {
        navigationExtraMovement += 2;
      } else if (rollTotal >= 4) {
        navigationExtraMovement += 1;
      }

      // Add to roll details with type
      rollDetails.push({
        name: actor.name,
        actorId: actor.id,
        rollTotal,
        modifier: 0,
        type: "Spellcasting",
        role: "Caster",
      });
    }
  }

  // Compile Final Message
  const groupedDetails = rollDetails.reduce((acc, detail) => {
    if (!acc[detail.role]) acc[detail.role] = [];
    acc[detail.role].push(detail);
    return acc;
  }, {});

  const resource = consumeResource
    ? `<div class="resource-holder"><span class="resources-consumed">🍖 Raciones consumidas ${crewNumber} 🍖</span></div>`
    : "";

  const finalMessage = `
    <div class="chat-roll-summary">
      <h2 class="chat-roll-title">Navigation Roll Summary</h2>
      ${Object.entries(groupedDetails)
        .map(
          ([role, details]) => `
            <div class="chat-roll-group chat-roll-${role.toLowerCase()}">
              <h3 class="chat-roll-role-title">${role}</h3>
              <ul class="chat-roll-list">
                ${details
                  .map((detail) => {
                    const actor = game.actors.get(detail.actorId);
                    if (!actor) {
                      return `
                        <li class="chat-roll-item">
                          <span class="chat-roll-name">${detail.name}</span>: Actor not found
                        </li>`;
                    }
                    let extraText = "";
                    let lostNavigator = "";
                    if (role === "Navigator") {
                      if (detail.rollTotal >= 8) {
                        extraText = "Movimiento rapido +1";
                      } else if (detail.rollTotal >= 4) {
                        extraText = "Movimiento normal";
                      }
                    } else if (role === "Caster") {
                      if (detail.rollTotal >= 8) {
                        extraText = "Raised Zephyr +2";
                      } else if (detail.rollTotal >= 4) {
                        extraText = "Normal Zephyr +1";
                      }
                    }
                    if (role === "Navigator" && detail.rollTotal <= 3) {
                      lostNavigator = `<span class="navigator-lost">Navegante perdido</span>`;
                    }
                    return `
                      <li class="chat-roll-item">
                        <div class="chat-roll-wrapper">
                          <img
                            class="chat-roll-img"
                            src="${actor.img}"
                            alt="${detail.name}"
                            width="40"
                            height="40"
                          />
                          <div class="chat-roll-content">
                            <div class="chat-roll-name">${detail.name}</div>
                            <div class="chat-roll-details">
                              <span class="chat-roll-result">Roll Total: ${detail.rollTotal}</span>,
                              <span class="chat-roll-modifier">Modifier: ${detail.modifier}</span>,
                              <span class="chat-roll-type">${detail.type}</span>

                            </div>
                               <div class="chat-roll-extra">${extraText}</div>
                              <div class="chat-roll-lost-holder">${lostNavigator}</div>
                          </div>
                        </div>
                      </li>`;
                  })
                  .join("")}
              </ul>
            </div>
          `
        )
        .join("")}
      <p class="chat-roll-helping-bonus"><strong>Bono de navegacion por Ayudantes:</strong> ${helpingBonus}</p>
      <p class="chat-roll-navigation-movement"><strong>Movimiento:</strong> ${navigationExtraMovement}</p>
      ${resource}
    </div>
  `;

  ChatMessage.create({ content: finalMessage });

  if (consumeResource) {
    window.pr.api.decrement("raciones-viaje", crewNumber);
    window.pr.api.decrement("sanity", 1);
    window.pr.status_bar.render();
  }

  // Play Sound Based on Navigator's Roll Result
  if (navigation.navigator) {
    const navigatorActor = game.actors.get(navigation.navigator.actorId);
    if (navigatorActor) {
      const navigatorRoll = rollDetails.find(
        (detail) =>
          detail.role === "Navigator" && detail.actorId === navigatorActor.id
      );

      if (navigatorRoll) {
        const rollTotal = navigatorRoll.rollTotal;
        let audioPath;

        // Determine sound based on roll total
        if (rollTotal >= 8) {
          audioPath = "modules/50-brazas-crew-managment/sounds/fullahead.mp3"; // Success sound
        } else if (rollTotal >= 4) {
          audioPath = "modules/50-brazas-crew-managment/sounds/arr.mp3"; // Neutral sound
        } else {
          audioPath = "modules/50-brazas-crew-managment/sounds/fail.mp3"; // Failure sound
        }

        // Play the sound
        foundry.audio.AudioHelper.play({
          src: audioPath,
          volume: 0.8,
          loop: false,
        });
      } else {
        console.warn("No roll data found for the navigator.");
      }
    } else {
      console.warn("Navigator actor not found.");
    }
  }

  foundry.audio.AudioHelper.play({ src: audioPath, volume: 0.8, loop: false });
}
