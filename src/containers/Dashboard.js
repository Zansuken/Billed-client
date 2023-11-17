import { formatDate } from "../app/format.js";
import DashboardFormUI from "../views/DashboardFormUI.js";
import BigBilledIcon from "../assets/svg/big_billed.js";
import { ROUTES_PATH } from "../constants/routes.js";
import USERS_TEST from "../constants/usersTest.js";
import Logout from "./Logout.js";
import { billStatuses } from "../constants/bills.js";

export const filteredBills = (data, status) => {
  return data && data.length
    ? data.filter((bill) => {
        let selectCondition;

        // in jest environment
        if (typeof jest !== "undefined") {
          selectCondition = bill.status === status;
        } else {
          /* istanbul ignore next */
          // in prod environment
          const userEmail = JSON.parse(localStorage.getItem("user")).email;
          selectCondition =
            bill.status === status &&
            ![...USERS_TEST, userEmail].includes(bill.email);
        }

        return selectCondition;
      })
    : [];
};

export const card = (bill) => {
  const firstAndLastNames = bill.email.split("@")[0];
  const firstName = firstAndLastNames.includes(".")
    ? firstAndLastNames.split(".")[0]
    : "";
  const lastName = firstAndLastNames.includes(".")
    ? firstAndLastNames.split(".")[1]
    : firstAndLastNames;

  return `
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${
    bill.id
  }'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `;
};

export const cards = (bills) => {
  return bills && bills.length ? bills.map((bill) => card(bill)).join("") : "";
};

export const getStatus = (sectionId) => {
  switch (sectionId) {
    case billStatuses.PENDING:
      return "pending";
    case billStatuses.ACCEPTED:
      return "accepted";
    case billStatuses.REFUSED:
      return "refused";
  }
};

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.selectedBill = null;
    this.expandedSections = [];
    $(`#arrow-icon-${billStatuses.PENDING}`).click((e) =>
      this.handleShowTickets(e, bills, billStatuses.PENDING)
    );
    $(`#arrow-icon-${billStatuses.ACCEPTED}`).click((e) =>
      this.handleShowTickets(e, bills, billStatuses.ACCEPTED)
    );
    $(`#arrow-icon-${billStatuses.REFUSED}`).click((e) =>
      this.handleShowTickets(e, bills, billStatuses.REFUSED)
    );
    new Logout({ localStorage, onNavigate });
  }

  handleClickIconEye = () => {
    const billUrl = $("#icon-eye-d").attr("data-bill-url");
    const imgWidth = Math.floor($("#modaleFileAdmin1").width() * 0.8);
    $("#modaleFileAdmin1")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`
      );
    if (typeof $("#modaleFileAdmin1").modal === "function")
      $("#modaleFileAdmin1").modal("show");
  };

  handleEditTicket(e, bill, bills) {
    this.selectedBill = this.selectedBill === bill.id ? null : bill.id;
    const isSelected = Boolean(this.selectedBill);
    if (isSelected) {
      bills.forEach((b) => {
        if (b.id === this.selectedBill) {
          $(`#open-bill${bill.id}`).css({ background: "#2A2B35" });
        } else {
          $(`#open-bill${b.id}`).css({ background: "#0D5AE5" });
        }
      });
      $(".dashboard-right-container div").html(DashboardFormUI(bill));
      $(".vertical-navbar").css({ height: "150vh" });
    } else {
      bills.forEach((b) => {
        $(`#open-bill${b.id}`).css({ background: "#0D5AE5" });
      });
      $(".dashboard-right-container div").html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `);
      $(".vertical-navbar").css({ height: "120vh" });
    }
    $("#icon-eye-d").click(this.handleClickIconEye);
    $("#btn-accept-bill").click((e) => this.handleAcceptSubmit(e, bill));
    $("#btn-refuse-bill").click((e) => this.handleRefuseSubmit(e, bill));
  }

  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: "accepted",
      commentAdmin: $("#commentary2").val(),
    };
    this.updateBill(newBill);
    this.onNavigate(ROUTES_PATH["Dashboard"]);
  };

  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: "refused",
      commentAdmin: $("#commentary2").val(),
    };
    this.updateBill(newBill);
    this.onNavigate(ROUTES_PATH["Dashboard"]);
  };

  handleShowTickets(e, bills, sectionId) {
    if (this.expandedSections.includes(sectionId)) {
      this.expandedSections = this.expandedSections.filter(
        (section) => section !== sectionId
      );
    } else {
      this.expandedSections = [...this.expandedSections, sectionId];
    }

    Object.values(billStatuses).forEach((billStatus) => {
      if (this.expandedSections.includes(billStatus)) {
        $(`#arrow-icon-${billStatus}`).css({ transform: "rotate(0deg)" });
        $(`#status-bills-container-${billStatus}`).html(
          cards(filteredBills(bills, getStatus(billStatus)))
        );
      } else {
        $(`#arrow-icon-${billStatus}`).css({ transform: "rotate(90deg)" });
        $(`#status-bills-container-${billStatus}`).html("");
      }
    });

    bills.forEach((bill) => {
      if (this.selectedBill === bill.id) {
        $(`#open-bill${bill.id}`).css({ background: "#2A2B35" });
      }
      $(`#open-bill${bill.id}`).click((e) =>
        this.handleEditTicket(e, bill, bills)
      );
    });

    return bills;
  }

  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot.map((doc) => ({
            id: doc.id,
            ...doc,
            date: doc.date,
            status: doc.status,
          }));
          return bills;
        })
        .catch((error) => {
          throw error;
        });
    }
  };

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: bill.id })
        .then((bill) => bill)
        .catch(console.log);
    }
  };
}
