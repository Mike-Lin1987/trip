import type { FlightGroup } from "@/types/trip";

export const flightGroups: FlightGroup[] = [
  {
    id: "kaohsiung-group",
    name: "高雄組",
    legs: [
      {
        label: "去程",
        date: "2026/11/14（六）",
        flightNumber: "CI176",
        departure: {
          time: "15:25",
          city: "高雄",
          airport: "高雄國際機場（KHH）",
          terminal: "航廈 I",
        },
        arrival: {
          time: "19:10",
          city: "大阪",
          airport: "關西國際機場（KIX）",
          terminal: "航廈 1",
        },
      },
      {
        label: "回程",
        date: "2026/11/21（六）",
        flightNumber: "CI177",
        departure: {
          time: "20:10",
          city: "大阪",
          airport: "關西國際機場（KIX）",
          terminal: "航廈 1",
        },
        arrival: {
          time: "22:45",
          city: "高雄",
          airport: "高雄國際機場（KHH）",
          terminal: "航廈 I",
        },
      },
    ],
  },
  {
    id: "taipei-group",
    name: "台北組",
    legs: [
      {
        label: "去程",
        date: "2026/11/14（六）",
        flightNumber: "CI172",
        departure: {
          time: "14:20",
          city: "台北",
          airport: "台灣桃園國際機場（TPE）",
          terminal: "航廈 2",
        },
        arrival: {
          time: "17:50",
          city: "大阪",
          airport: "關西國際機場（KIX）",
          terminal: "航廈 1",
        },
      },
      {
        label: "回程",
        date: "2026/11/21（六）",
        flightNumber: "CI173",
        departure: {
          time: "19:00",
          city: "大阪",
          airport: "關西國際機場（KIX）",
          terminal: "航廈 1",
        },
        arrival: {
          time: "21:15",
          city: "台北",
          airport: "台灣桃園國際機場（TPE）",
          terminal: "航廈 2",
        },
      },
    ],
  },
];
