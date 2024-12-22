import { fetchCrewData } from "./crew-admin.js";
let paymentDispatcherData = {};

export async function calculateAndDistributePay(html, totalPay) {
  const { crewList, boatPay = 0 } = await fetchCrewData();
  paymentDispatcherData = {};

  // Calculate total shares
  const totalShares =
    crewList.reduce((sum, crew) => sum + crew.pay, 0) + boatPay;

  if (totalShares === 0) {
    ui.notifications.warn("No crew members with assigned pay shares.");
    return;
  }

  // Distribute pay
  const payResults = crewList.map((crew) => {
    return {
      name: crew.name,
      id: crew.id,
      img: crew.img,
      pay: crew.pay,
      amount: ((crew.pay / totalShares) * totalPay).toFixed(0),
    };
  });

  html.find("#make-payment-button").show();

  // Render Results
  const payContainer = html.find("#pay-results");
  let resultsHTML = "<h3>Pay Distribution</h3>";
  if (boatPay >= 1) {
    resultsHTML += `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div>
          <strong>Partes para el Barco</strong><br/>
          <span>${boatPay} Partes, 🪙${(
      (boatPay / totalShares) *
      totalPay
    ).toFixed(0)}</span>
        </div>
      </div>
    `;
  }

  payResults.forEach((result) => {
    paymentDispatcherData[result.name] = {
      tokenId: result.id,
      amount: parseInt(result.amount),
    };
    resultsHTML += `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <img src="${result.img}" alt="${result.name}" width="40" height="40" style="margin-right: 10px; border-radius: 5px;"/>
        <div>
          <strong>${result.name}</strong><br/>
          <small>Pay: ${result.pay}, 🪙${result.amount}</small>
        </div>
      </div>
    `;
  });
  payContainer.html(resultsHTML);
}

export async function activatePaymentListeners(html) {
  // Warning dialog before proceeding with payments
  if (!game.user.isGM) {
    ui.notifications.warn(
      "Only the GM can distribute payments. Please ask your GM to do this."
    );
    return;
  }

  const confirmPayment = await Dialog.confirm({
    title: "Confirm Payment Distribution",
    content:
      "<p>Are you sure you want to distribute the payments to all crew members?</p><p>This action cannot be undone.</p>",
    yes: () => true,
    no: () => false,
  });

  if (!confirmPayment) return;
  for (const [name, data] of Object.entries(paymentDispatcherData)) {
    const token = canvas.tokens.get(data.tokenId);

    console.log(data);

    console.log(token);
    const actor = token.actor;
    console.log(actor);
    if (actor) {
      await actor.update({
        "system.details.currency": actor.system.details.currency + data.amount,
      });
    }
    html.find("#make-payment-button").hide();
    html.find("#total-pay-input").val("");
  }
  paymentDispatcherData = {};
  // Process payments
  // for (const [name, data] of Object.entries(paymentDispatcherData)) {
  //   const token = canvas.tokens.get(data.tokenId);
  //   if (token) {
  //     await token.actor.update({
  //       "system.currency.gp": token.actor.system.currency.gp + data.amount,
  //     });
  //   }
  // }
  // paymentDispatcherData = {};
}

export async function printPayToChat(totalPay) {
  const { crewList, boatPay = 0 } = await fetchCrewData();

  // Calculate total shares
  const totalShares =
    crewList.reduce((sum, crew) => sum + crew.pay, 0) + boatPay;

  if (totalShares === 0) {
    ui.notifications.warn("No crew members with assigned pay shares to print.");
    return;
  }

  // Distribute pay
  const payResults = crewList.map((crew) => {
    return {
      name: crew.name,
      img: crew.img,
      pay: crew.pay,
      amount: ((crew.pay / totalShares) * totalPay).toFixed(0),
    };
  });

  // Construct Chat Message
  let messageContent = `
    <div class="pay-chat">
      <h2 class="pay-chat-title">Distribución del botín</h2>
  `;
  // Group crew members by pay amount
  const payGroups = payResults.reduce((groups, result) => {
    const key = result.pay;
    if (!groups[key]) {
      groups[key] = {
        members: [],
        totalAmount: 0,
      };
    }
    groups[key].members.push(result);
    groups[key].totalAmount += parseFloat(result.amount);
    return groups;
  }, {});

  // Add boat pay message if boatPay exists and is greater than 0
  // Add message for single share value
  messageContent += `<p class="pay-chat-share-value"><strong>Valor por parte:</strong> 🪙${(
    totalPay / totalShares
  ).toFixed(0)}</p>`;

  if (boatPay && boatPay > 0) {
    messageContent += `<p class="pay-chat-boat-pay"><strong>Barco:</strong> ${boatPay} Partes - 🪙${(
      (boatPay / totalShares) *
      totalPay
    ).toFixed(0)}</p>`;
  }

  // Sort pay groups by pay level (descending)
  Object.entries(payGroups)
    .sort(([a], [b]) => b - a)
    .forEach(([pay, group]) => {
      const memberCount = group.members.length + boatPay;
      const totalAmount = group.totalAmount.toFixed(0);
      // Calculate total shares for this pay group
      const totalSharesForGroup = group.members.reduce(
        (sum, member) => sum + parseInt(pay),
        0
      );

      const payLabel = pay === "1" ? "Parte" : "Partes";
      messageContent += `
      <tbody class="pay-chat"><table>
        <tr>
          <td colspan="3" style="padding: 10px 5px;">
        <strong>${pay} ${payLabel}</strong> - Total: 🪙${totalAmount} (${totalSharesForGroup} Partes)<br>
        <div style="display: flex; gap: 5px; margin-top: 5px;">
          ${group.members
            .map(
              (member) => `
            <img src="${member.img}"
            width="24"
            height="24"
            style="border-radius: 3px; border: 0;"
            title="${member.name}"
            />
          `
            )
            .join("")}
        </div>
          </td>
        </tr>`;
    });

  console.timeLog(paymentDispatcherData);
  messageContent += `  </tbody></table>`;
  messageContent += ` <div class="pay-chat-footer">
    <img src="https://i.imgur.com/ld7PMMo_d.png" class="pay-chat-stain">
    <img src="https://i.imgur.com/j4ckQQA.png" class="pay-chat-seal">
  </div>`;

  // Send to Chat
  ChatMessage.create({
    user: game.user.id,
    content: messageContent,
  });
}
