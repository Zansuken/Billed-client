/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When I open a bill detail", () => {
    window.$ = $;
    $.fn.modal = jest.fn();
    test("Then the modal should be displayed", async () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const container = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const billDetailsBtn = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(
        container.handleClickIconEye(billDetailsBtn)
      );

      billDetailsBtn.addEventListener("click", handleClickIconEye);
      fireEvent.click(billDetailsBtn);

      // The function is indeed called but the modal is never updated in the test compare to the app.
      // Plus it's useless to test if the modal element is present because it's present from the start (hidden normally until the user clicks on the button).
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
  });
  describe("When I click on new bill button", () => {
    test("Then I should be sent on the new bill page", async () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const container = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const btnNewBill = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(container.handleClickNewBill);
      btnNewBill.addEventListener("click", handleClickNewBill);
      fireEvent.click(btnNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();

      // Checks if the new bill form is present
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });
});

describe("Given I am a user connected as employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "johndoe@email.com" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentAccepted = screen.getAllByText(/accepté/i);
      expect(contentAccepted).toHaveLength(1);
      const contentPending = screen.getAllByText(/en attente/i);
      expect(contentPending).toHaveLength(1);
      const contentRefused = screen.getAllByText(/refused/i);
      expect(contentRefused).toHaveLength(2);
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "User",
            email: "johndoe@email.com",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
