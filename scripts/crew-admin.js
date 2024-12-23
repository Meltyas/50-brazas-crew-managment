// This is only for development uses
export async function clearCrewList() {
  await game.settings.set("crew-manager", "crewData", {
    crewList: [],
  });
}

export async function fetchCrewData() {
  await validateCrewList();
  let data = game.settings.get("crew-manager", "crewData");
  console.log(data);

  // Ensure skeleton structure if missing
  if (!data || !data.crewList) {
    data = { crewList: [], crewNumber: 0, boatPay: 0 };
    await saveCrewData(data.crewList, data.boatPay);
  }

  const crewList = Array.isArray(data.crewList) ? data.crewList : [];
  const crewNumber = crewList.length;
  const boatPay = data.boatPay;

  return { crewList, crewNumber, boatPay };
}

export async function saveCrewData(crewList, boatPay) {
  const crewNumber = crewList.length;
  await game.settings.set("crew-manager", "crewData", {
    crewList,
    crewNumber,
    boatPay,
  });
}

// export async function updateTokenNamesToActorNames() {
//   const tokens = canvas.tokens.placeables;
//   for (const token of tokens) {
//     const actorName = token.actor?.name;
//     if (actorName && token.name !== actorName) {
//       await token.document.update({ name: actorName });
//     }
//   }
// }

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
    const { boatPay } = await fetchCrewData();
    await saveCrewData(crewList, boatPay);
  }
}

export async function removeCrewMember(index) {
  const { crewList } = await fetchCrewData();
  crewList.splice(index, 1);
  const { boatPay } = await fetchCrewData();
  await saveCrewData(crewList, boatPay);
}

export async function increasePay(index) {
  const { crewList } = await fetchCrewData();
  crewList[index].pay += 1;
  const { boatPay } = await fetchCrewData();
  await saveCrewData(crewList, boatPay);
}

export async function decreasePay(index) {
  const { crewList } = await fetchCrewData();
  if (crewList[index].pay > 0) {
    crewList[index].pay -= 1;
    const { boatPay } = await fetchCrewData();
    await saveCrewData(crewList, boatPay);
  }
}

async function cleanCrewData(crewList) {
  const validCrewList = crewList.filter((crew) =>
    game.actors.get(crew.actorId)
  );
  if (validCrewList.length !== crewList.length) {
    console.warn("Invalid actors found in crew list. Cleaning up...");
  }
  return validCrewList;
}

export async function validateCrewList() {
  let { crewList, boatPay } = game.settings.get("crew-manager", "crewData");
  crewList = Array.isArray(crewList) ? crewList : []; // Ensure crewList is always an array

  const validCrewList = await cleanCrewData(crewList);

  if (validCrewList.length !== crewList.length) {
    await saveCrewData(validCrewList, boatPay); // Save only valid data
  }

  return { crewList: validCrewList, boatPay };
}

export function renderCrewList(html, crewList, crewNumber, boatPay) {
  const crewListContainer = html.find("#crew-list");
  const crewNumberElement = html.find("#crew-number");
  const boatPayElement = html.find("#boat-pay");

  crewNumberElement.text(`Crew Number: ${crewNumber}`);
  boatPayElement.val(boatPay);

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
  });

  crewListContainer.html(listHTML);

  html.find("#change-boat-pay").click(async () => {
    const newBoatPay = parseInt(html.find("#boat-pay").val(), 10);
    if (isNaN(newBoatPay)) {
      ui.notifications.warn("Please enter a valid number for boat pay.");
      return;
    }

    const { crewList } = await fetchCrewData();
    await saveCrewData(crewList, newBoatPay);
    ui.notifications.info("Boat pay updated successfully.");
  });
}
