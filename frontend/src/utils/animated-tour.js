import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import Cookies from 'js-cookie';


export const driverObj = driver({
    showProgress: true,
    nextBtnText: 'Następny',
    prevBtnText: 'Poprzedni',
    doneBtnText: 'Gotowe',
    steps: [
      { element: '.overview-newest-payment', popover: { title: 'Najnowsza faktura', description: 'Tutaj zobaczysz informacje o Twojej najnowszej fakturze.' } },
      { element: '.overview-current-month', popover: { title: 'Podsumowanie aktualnego miesiąca', description: 'Podsumowanie wszystkich płatności w bierzącym miesiącu.' } },
      { element: '.overview-paid-percentage', popover: { title: 'Procent zapłaconych faktur', description: 'Tu zobaczysz ile procent faktur masz już opłacone.' } },
      { element: '.overview-next-payment', popover: { title: 'Dane najbliższej płatności', description: 'Informacje o fakturze z najbliższą datą płatności.' } },
      { element: '.overview-monthly-chart', popover: { title: 'Podsumowanie roku', description: 'Wykres miesięcznych wydatków z porównaniem do poprzedniego roku.' } },
      { element: '.overview-categories-chart', popover: { title: 'Wykres kategorii', description: 'Podział płatności według kategorii.' } },
      { element: '.latest-invoices', popover: { title: 'Ostatnie faktury', description: 'Tu masz podgląd na 10 ostatnich faktur. Mozesz kliknąć na wybraną fakturę, żeby zobaczyć szczegóły.' } },
      { element: '.animated-tour', popover: { title: 'Przewodnik', description: 'Możesz w każdej chwili wróć do przewodnika.' } },
    ],
    onDestroyStarted: () => {
      Cookies.set('DisableAnimatedTour', true);
      driverObj.destroy();
      }
  });
