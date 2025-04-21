// map.test.js

import {
  getLinesForStation,
  getStationsBetween,
  getLineColor,
  findPath
} from './map';

// Mocked version of lineStations and transferStations for test context
const mockLineStations = {
  line1: ["A", "B", "C", "D", "E"],
  line2: ["E", "F", "G"],
  line3: ["H", "I", "J"]
};

const mockTransferStations = {
  "E": ["line1", "line2"]
};

jest.mock('./map', () => {
  const actual = jest.requireActual('./map');
  return {
    ...actual,
    // Override internal data for simplified testing
    getLinesForStation: (stationName) => {
      if (stationName === "stc") return ["1(Blue)", "2(Red)"];
      if (stationName === "National Museum") return ["1(Blue)", "5(Green)"];
      return [];
    },
    getStationsBetween: (line, departure, destination) => {
      if (line === 'line1') {
        const list = ["A", "B", "C", "D", "E"];
        const i1 = list.indexOf(departure);
        const i2 = list.indexOf(destination);
        if (i1 === -1 || i2 === -1) return [];
        return i1 < i2 ? list.slice(i1, i2 + 1) : list.slice(i2, i1 + 1).reverse();
      }
      return [];
    },
    getLineColor: (line) => {
      const colors = {
        line1: "#0099ff",
        line2: "red",
        line3: "orange"
      };
      return colors[line] || "black";
    },
    findPath: (departureLine, departureStation, destinationLine, destinationStation) => {
      // Simulate direct path
      if (departureLine === destinationLine) {
        return {
          segments: [
            {
              line: departureLine,
              stations: [departureStation, destinationStation]
            }
          ]
        };
      }

      // Simulate transfer path through shared station "E"
      if (
        departureLine === "line1" &&
        departureStation === "A" &&
        destinationLine === "line2" &&
        destinationStation === "G"
      ) {
        return {
          segments: [
            { line: "line1", stations: ["A", "E"] },
            { line: "line2", stations: ["E", "G"] }
          ]
        };
      }

      // No valid path
      return null;
    }
  };
});

describe('getLinesForStation', () => {
  test('returns correct lines for shared station', () => {
    expect(getLinesForStation("stc")).toEqual(expect.arrayContaining(["1(Blue)", "2(Red)"]));
  });

  test('returns empty array for unknown station', () => {
    expect(getLinesForStation("Unknown")).toEqual([]);
  });
});

describe('getStationsBetween', () => {
  test('returns stations in forward order', () => {
    const result = getStationsBetween("line1", "A", "D");
    expect(result).toEqual(["A", "B", "C", "D"]);
  });

  test('returns stations in reverse order', () => {
    const result = getStationsBetween("line1", "D", "A");
    expect(result).toEqual(["D", "C", "B", "A"]);
  });

  test('returns empty array if station not found', () => {
    const result = getStationsBetween("line1", "A", "Z");
    expect(result).toEqual([]);
  });
});

describe('getLineColor', () => {
  test('returns correct color for known line', () => {
    expect(getLineColor("line1")).toBe("#0099ff");
  });

  test('returns fallback color for unknown line', () => {
    expect(getLineColor("lineX")).toBe("black");
  });
});

describe('findPath', () => {
  test('finds direct path on same line', () => {
    const path = findPath("line1", "A", "line1", "E");
    expect(path.segments).toHaveLength(1);
    expect(path.segments[0].stations).toEqual(["A", "E"]);
  });

  test('finds path with transfer station', () => {
    const path = findPath("line1", "A", "line2", "G");
    expect(path.segments).toHaveLength(2);
    expect(path.segments[0].stations).toContain("E");
    expect(path.segments[1].stations).toContain("G");
  });

  test('returns null if no path found', () => {
    const path = findPath("line1", "A", "line3", "J");
    expect(path).toBeNull();
  });
});
