/**
 * Sorts an array of objects by date in either ascending or descending order.
 *
 * @param {"asc" | "desc"} direction - The sorting direction. Use "asc" for ascending order and "desc" for descending order.
 * @param {Array<Object>} date - The array of objects to be sorted.
 * @returns {Array<Object>} The sorted array of objects.
 * @throws {Error} If an invalid direction is provided.
 */
export const sortDate = (direction, date) => {
  return date.sort((a, b) => {
    if (direction === "asc") {
      return new Date(a.date) - new Date(b.date);
    } else if (direction === "desc") {
      return new Date(b.date) - new Date(a.date);
    } else {
      throw new Error('Invalid direction. Please provide "asc" or "desc".');
    }
  });
};
