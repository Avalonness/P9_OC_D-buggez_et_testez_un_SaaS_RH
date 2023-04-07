/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import NewBillUI from "../views/NewBillUI.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("When i click on the eye button, Then modal should be open up ", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const store = jest.fn()
      $.fn.modal = jest.fn()
      const bill = new Bills({document, onNavigate, store, localStorage})
      const inconEyes = screen.getAllByTestId('icon-eye');
      inconEyes.forEach((item) => {
        const handleClickIconEye = jest.fn(() => bill.handleClickIconEye(item))
  
        item.addEventListener("click", handleClickIconEye)
    
        fireEvent.click(item)
        
        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toBeTruthy()
      })
      
    })
    test("getBills should return an array of bills and log its length", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const mockedBills = [
        {id: 1, date: "2022-01-01", status: "pending"},
        {id: 2, date: "2022-02-01", status: "accepted"},
        {id: 3, date: "2022-03-01", status: "refused"}
      ];
      const store = {
        bills: () => ({
          list: () => Promise.resolve(mockedBills)
        })
      };
      
      const logMock = jest.spyOn(console, 'log');
      const billsContainer = new Bills({
        document, onNavigate, store, localStorage
      });
      const result = await billsContainer.getBills();
      expect(result).toEqual(expect.any(Array));
      expect(result.length).toEqual(mockedBills.length);
      expect(logMock).toHaveBeenCalledWith('length', mockedBills.length);
      logMock.mockRestore();
    });

    describe("When i click on New Bill button", () => {
    test("Then i should go to New Bill page", async () => {

      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (url) => {document.body.html = ROUTES_PATH[url]}
      const store = jest.fn()
      const bill = new Bills({document, onNavigate, store, localStorage})
      const  newBillButton = screen.getByTestId("btn-new-bill");
      const handleClick = jest.fn(() => bill.handleClickNewBill());

      
      newBillButton.addEventListener("click", handleClick)
      fireEvent.click(newBillButton)
      document.body.innerHTML = NewBillUI({ data: bills })

      expect(handleClick).toHaveBeenCalled();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()

      })
    })

  })

  describe("(Integration) - When I navigate to Bills", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          "localStorage",
          { value: localStorageMock }
      )
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetch bills with API, send 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetch bills with API, send 500 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
  
})
