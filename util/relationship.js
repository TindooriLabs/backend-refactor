import { relationshipTypeIds } from "../database/constants.js";
import { objectSwap } from "./mapping.js";

export const relationshipNamesById = objectSwap(relationshipTypeIds);

export const aggregateRelationshipType = (
  relationship1 = "",
  relationship2 = "",
  convertFromIds
) => {
  if (convertFromIds) {
    relationship1 = relationship1 ? relationshipNamesById[relationship1] : "";
    relationship2 = relationship2 ? relationshipNamesById[relationship2] : "";
  }
  const relationship1Upper = relationship1 ? relationship1.toUpperCase() : "",
    relationship2Upper = relationship2 ? relationship2.toUpperCase() : "";
  if (relationship1Upper === "LIKE") {
    if (relationship2Upper === "LIKE") {
      return "MATCH";
    }
    if (relationship2Upper === "SKIP") {
      return "NONMATCH";
    }

    return "INCOMPLETE";
  } else if (relationship1Upper === "SKIP") {
    return "NONMATCH";
  }

  return relationship1Upper;
};
