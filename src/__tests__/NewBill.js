/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, getByTestId} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js";
import { localStorageMock as mockLocalStorage } from "../__mocks__/localStorage";
import mockStore from '../__mocks__/store.js';
import { bills } from "../fixtures/bills"
import userEvent from '@testing-library/user-event';
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import router from "../app/Router.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
  })
});

describe("Quand je créer une nouvelle note:", () => {
  describe("J'arrive sur la page de pour créer une note:", () => {
    test("Alors le bouton d'envoie est désactivé", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const buttonSubmit = document.querySelector("#btn-send-bill");

      expect(buttonSubmit.disabled).toBeTruthy()
    })
    
  })

  describe("Given I am connected as an employee", () => {
    describe("When I navigate to NewBill", () => {
      test("Then I should see a form to submit a new bill", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
  
        Object.defineProperty(window, "localStorage", {
          value: new class {
            getItem() {
              return JSON.stringify({
                type: "Employee",
                email: "employee@test.com",
                name: "Employee",
                lastName: "Tester",
              });
            }
            setItem() {}
          },
        });
  
        expect(
          screen.getByTestId("form-new-bill")
        ).toBeTruthy();
      });
    });
  });
  
});

describe('handleChangeFile', () => {
  beforeEach(() => {
    const html = NewBillUI()
    document.body.innerHTML = html
  });

  mockStore.bills = jest.fn().mockReturnValue({
    ...mockStore.bills(),
    create: jest.fn(mockStore.bills().create),
  });

  it('should enable the submit button and set error text to empty if the file has a valid extension', async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: mockLocalStorage });
    const fileInput = screen.getByTestId('file');
    const file = new File([''], 'test.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await newBill.handleChangeFile({
      target: { files: [file], value: 'C:\\fakepath\\test.png' },
      preventDefault: () => {},
    });

    expect(mockStore.bills().create).toHaveBeenCalled();
    expect(document.querySelector('#btn-send-bill').disabled).toBe(false);
    expect(document.querySelector('#error_file').textContent).toBe('');
  });

  it('should disable the submit button and display an error message if the file has an invalid extension', async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: mockLocalStorage });
    const fileInput = screen.getByTestId('file');
    const file = new File([''], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await newBill.handleChangeFile({
      target: { files: [file], value: 'C:\\fakepath\\test.txt' },
      preventDefault: () => {},
    });

    expect(document.querySelector('#btn-send-bill').disabled).toBe(true);
    expect(document.querySelector('#error_file').textContent).toBe('Mauvaise extension d\'image, veuillez fournir une image sous le formet png, jpg ou jpeg.');
    expect(document.querySelector('#error_file').style.color).toBe('red');
  });
});

describe('handleSubmit', () => {
  it('should call updateBill with the correct bill object when the form is submitted', async () => {
    const html = NewBillUI()
    document.body.innerHTML = html

    const onNavigate = jest.fn();
    const updateBill = jest.fn();

    const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: mockLocalStorage });
    newBill.updateBill = updateBill;

    const form = document.querySelector('form');
    const expenseType = screen.getByTestId('expense-type');
    const expenseName = screen.getByTestId('expense-name');
    const amount = screen.getByTestId('amount');
    const dateElement = screen.getByTestId("datepicker");
    const vat = screen.getByTestId('vat');
    const pct = screen.getByTestId('pct');
    const commentary = screen.getByTestId('commentary');

    userEvent.selectOptions(expenseType, 'Restaurants et bars');
    userEvent.type(expenseName, 'Test Expense');
    userEvent.type(amount, '100');
    fireEvent.change(dateElement, { target: { value: "2023-01-01" } });
    userEvent.type(vat, '20');
    userEvent.type(pct, '10');
    userEvent.type(commentary, 'Test Commentary');

    form.addEventListener('submit', newBill.handleSubmit);
    fireEvent.submit(form);

    const expectedBill = {
      email: "employee@test.com",
      type: "Restaurants et bars",
      name: "Test Expense",
      amount: 100,
      date: "2023-01-01",
      vat: "20",
      pct: 10,
      commentary: "Test Commentary",
      fileUrl: null,
      fileName: null,
      status: "pending",
    };
    
    expect(newBill.updateBill).toHaveBeenCalledWith(expectedBill);
    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
  });

  it('when i submit an bill, then i received a 404 error', async () => {

  })

});

describe("Given I am connected as an employee", () => {
  describe("When I submit form", () => {
    test("fetch bill from API POST", async () => {
      const billUpdateMocked = mockStore.bills().update();
      const billPromiseSolved = await billUpdateMocked.then((data) => {
        return data;
      });

      expect(billPromiseSolved.id).toEqual("47qAXb6fIm2zOKkLzMro");
      expect(billPromiseSolved.vat).toEqual("80");
      expect(billPromiseSolved.amount).toEqual(400);
      expect(billPromiseSolved.fileUrl).toEqual(
        "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a"
      );
    });
  });
});

    test("Fetch error 404 from API", async () => {
      jest.spyOn(mockStore, "bills");
      console.error = jest.fn();

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "e@e",
        })
      );
      document.body.innerHTML = `<div id="root"></div>`;
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      const newBillsClass = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit1 = jest.fn(newBillsClass.handleSubmit);
      form.addEventListener("submit", handleSubmit1);
      fireEvent.submit(form);

      await new Promise(process.nextTick);
      expect(console.error).toHaveBeenCalled();
});



