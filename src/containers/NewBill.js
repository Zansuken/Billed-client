import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }
  handleChangeFile = (e) => {
    e.preventDefault();
    const submitBtn = this.document.getElementById("btn-send-bill");
    const fileInputContainer = this.document.getElementById("file-container");
    const fileError = this.document.createElement("span");
    fileError.setAttribute("id", "file-error-helper");
    fileError.setAttribute("data-testid", "file-error-helper");
    const fileErrorStyle = {
      ["margin-top"]: "8px",
      color: "red",
      position: "absolute",
    };
    Object.entries(fileErrorStyle).forEach(([key, value]) => {
      fileError.style[key] = value;
    });
    const file = this.document.querySelector('input[data-testid="file"]')
      .files[0];
    const getExtension = (str) => str.slice(str.lastIndexOf("."));
    const fileName = file.name;
    const fileExtension = getExtension(fileName);
    const authorizedExtensions = [".jpeg", ".jpg", ".png", ".gif"];
    const errorHelperElement =
      this.document.getElementById("file-error-helper");
    const getErrorHelper = () =>
      `This file type: "${getExtension(
        fileName
      )}" is not allowed. Authorized extensions: ${authorizedExtensions.join(
        ", "
      )}`;
    const isFileValid = authorizedExtensions.includes(fileExtension);
    if (!isFileValid) {
      submitBtn.disabled = true;
      if (errorHelperElement) {
        errorHelperElement.textContent = getErrorHelper();
      } else {
        fileInputContainer.appendChild(fileError);
        fileError.textContent = getErrorHelper();
      }
    } else {
      if (errorHelperElement) {
        errorHelperElement.remove();
      }
      submitBtn.disabled = false;
    }

    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    if (isFileValid) {
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch((error) => console.error(error));
    }
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
