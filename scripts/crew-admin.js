// This is only for development uses
export async function clearCrewList() {
  await game.settings.set("crew-manager", "crewData", {
    crewList: [],
  });
}

export async function fetchCrewData() {
  let data = game.settings.get("crew-manager", "crewData");

  if (!data || !data.crewList) {
    data = {
      crewList: [],
      crewNumber: 0,
      boatPay: 0,
      navigation: {
        navigator: null,
        caster: null,
        helpers: [],
        boatHandling: 0,
        boatMovement: 0,
        handlingMod: 0,
      },
    };
    await saveCrewData(data.crewList, data.boatPay, data.navigation);
  }

  return {
    crewList: Array.isArray(data.crewList) ? data.crewList : [],
    crewNumber: data.crewList.length,
    boatPay: data.boatPay,
    navigation: data.navigation || {
      navigator: null,
      caster: null,
      helpers: [],
      boatHandling: 0,
      boatMovement: 0,
      handlingMod: 0,
    },
  };
}

export async function saveCrewData(crewList, boatPay, navigation) {
  const crewNumber = crewList.length;
  const clonedNavigation = foundry.utils.deepClone(navigation);
  console.log("Saving Data (Cloned Navigation):", {
    crewList,
    boatPay,
    navigation: clonedNavigation,
  });

  await game.settings.set("crew-manager", "crewData", {
    crewList,
    crewNumber,
    boatPay,
    navigation: clonedNavigation,
  });
}

export async function addCrewMembers() {
  const selected = canvas.tokens.controlled;
  if (selected.length === 0) {
    ui.notifications.warn("Please select at least one token to add.");
    return;
  }

  const { crewList } = await fetchCrewData();
  let addedCount = 0;

  selected.forEach((token) => {
    if (!crewList.some((member) => member.id === token.id)) {
      const actor = game.actors.get(token.actor.id);
      if (!actor) {
        ui.notifications.warn(
          `Actor with ID ${token.actor.id} with name ${token.name} not found. Consider removing that token.`
        );
        return; // Skip this entry if the actor is not found
      }
      console.log(token);
      console.log("token.actor.id", actor.id);

      const existingMember = crewList.find(
        (member) => member.actorId === actor.id
      );
      if (existingMember) {
        existingMember.id = token.id;
      } else {
        crewList.push({
          id: token.id,
          actorId: token.actor.id,
          pay: 1,
        });
        addedCount++;
      }
    }
  });

  if (addedCount > 0) {
    const { boatPay, navigation } = await fetchCrewData();
    await saveCrewData(crewList, boatPay, navigation);
  }
}

export async function removeCrewMember(index) {
  const { crewList, boatPay, navigation } = await fetchCrewData();
  crewList.splice(index, 1);
  await saveCrewData(crewList, boatPay, navigation);
}

export async function increasePay(index) {
  const { crewList, boatPay, navigation } = await fetchCrewData();
  crewList[index].pay += 1;
  await saveCrewData(crewList, boatPay, navigation);
}

export async function decreasePay(index) {
  const { crewList, boatPay, navigation } = await fetchCrewData();
  if (crewList[index].pay > 0) {
    crewList[index].pay -= 1;
    await saveCrewData(crewList, boatPay, navigation);
  }
}

async function cleanCrewData(crewList, navigation) {
  console.log("Before Cleaning Navigation:", navigation);

  // Validate Navigator
  if (navigation.navigator) {
    const navigatorActor = game.actors.get(navigation.navigator.actorId);
    if (!navigatorActor) {
      console.warn(
        `Navigator with ID ${navigation.navigator.actorId} not found. Removing from navigation.`
      );
      navigation.navigator = null;
    }
  }

  // Validate Caster
  if (navigation.caster) {
    const casterActor = game.actors.get(navigation.caster.actorId);
    if (!casterActor) {
      console.warn(
        `Caster with ID ${navigation.caster.actorId} not found. Removing from navigation.`
      );
      navigation.caster = null;
    }
  }

  // Validate Helpers
  navigation.helpers = navigation.helpers.filter((helper) => {
    const helperActor = game.actors.get(helper.actorId);
    if (!helperActor) {
      console.warn(
        `Helper with ID ${helper.actorId} not found. Removing from navigation.`
      );
      return false;
    }
    return true;
  });

  if (typeof navigation.boatHandling !== "number") navigation.boatHandling = 0;
  if (typeof navigation.boatMovement !== "number") navigation.boatMovement = 0;
  if (typeof navigation.handlingMod !== "number") navigation.handlingMod = 0;

  console.log("After Cleaning Navigation:", navigation);
  return { crewList, navigation };
}

export async function validateCrewList() {
  let { crewList, boatPay, navigation } = game.settings.get(
    "crew-manager",
    "crewData"
  );

  console.log("validateCrewList (Before Clean):", { crewList, navigation });

  const validatedData = await cleanCrewData(crewList, navigation);

  console.log("validateCrewList (After Clean):", { crewList, navigation });

  if (validatedData.crewList.length !== crewList.length) {
    await saveCrewData(
      validatedData.crewList,
      boatPay,
      validatedData.navigation
    );
  }

  return {
    crewList: validatedData.crewList,
    boatPay,
    navigation: validatedData.navigation,
  };
}

export async function renderCrewList(html, crewList, crewNumber, boatPay) {
  const crewListContainer = html.find("#crew-list");
  const crewNumberElement = html.find("#crew-number");
  const boatPayElement = html.find("#boat-pay");

  crewNumberElement.text(`Crew Number: ${crewNumber}`);
  boatPayElement.val(boatPay);

  const { navigation } = await fetchCrewData();

  const boatHandlingElement = html.find("#boat-handling");
  boatHandlingElement.val(navigation.boatHandling);

  const boatMovementElement = html.find("#boat-movement");
  boatMovementElement.val(navigation.boatMovement);

  const handlingModElement = html.find("#handling-mod");
  handlingModElement.val(navigation.handlingMod);

  if (crewList.length === 0) {
    crewListContainer.html(
      `<p class="placeholder-crew-text">No crew members added.</p>`
    );
    return;
  }

  let listHTML = "";
  crewList.forEach((crew, index) => {
    const actor = game.actors.get(crew.actorId);

    if (!actor) {
      console.warn(
        `Actor with ID ${crew.actorId} not found. Removing from list.`
      );
      return; // Skip this entry if the actor is not found
    }

    listHTML += `
      <div class="crew-member" data-index="${index}">
        <img src="${actor.img}" alt="${actor.name}"/>
        <div class="crew-member-info">
          <span class="crew-member-name">${actor.name}</span><br/>
          <small>Pay: ${crew.pay}</small>
        </div>
        <button class="btn btn-decrease" style="margin-right: 5px;">-</button>
        <button class="btn btn-increase" style="margin-right: 5px;">+</button>
        <button class="btn btn-remove" style="background-color: red; color: white;">X</button>
      </div>
    `;

    // Explicitly set values for boat-handling, boat-movement, and handling-mod
    if (navigation) {
      html.find("#boat-handling").val(navigation.boatHandling || 0);
      html.find("#boat-movement").val(navigation.boatMovement || 0);
      html.find("#handling-mod").val(navigation.handlingMod || 0);
    } else {
      console.warn("Navigation data missing or invalid.");
    }
  });

  crewListContainer.html(listHTML);

  html.find("#change-boat-pay").click(async () => {
    const newBoatPay = parseInt(html.find("#boat-pay").val(), 10);
    if (isNaN(newBoatPay)) {
      ui.notifications.warn("Please enter a valid number for boat pay.");
      return;
    }

    const { crewList, navigation } = await fetchCrewData();
    await saveCrewData(crewList, newBoatPay, navigation);
    ui.notifications.info("Boat pay updated successfully.");
  });

  html.find("#boat-handling").change(async () => {
    const newBoatHandling = parseInt(html.find("#boat-handling").val(), 10);
    const { crewList, boatPay, navigation } = await fetchCrewData();
    navigation.boatHandling = newBoatHandling;
    await saveCrewData(crewList, boatPay, navigation);
  });

  html.find("#boat-movement").change(async () => {
    const newBoatMovement = parseInt(html.find("#boat-movement").val(), 10);
    const { crewList, boatPay, navigation } = await fetchCrewData();
    navigation.boatMovement = newBoatMovement;
    await saveCrewData(crewList, boatPay, navigation);
  });

  html.find("#handling-mod").change(async () => {
    const newHandlingMod = parseInt(html.find("#handling-mod").val(), 10);
    const { crewList, boatPay, navigation } = await fetchCrewData();
    navigation.handlingMod = newHandlingMod;
    await saveCrewData(crewList, boatPay, navigation);
  });
}
