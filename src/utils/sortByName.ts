type Arr = Array<Ele>;
type Ele = { name?: string | null };

export const sortByName = (arr: Arr) => {
    const temp = arr.map((a) => a);
    temp.sort((a, b) => {
        if (!a.name || !b.name) return 0;
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        if (nameA < nameB) {
            return -1; // 'a' should come before 'b' in the sorted order
        }
        if (nameA > nameB) {
            return 1; // 'a' should come after 'b' in the sorted order
        }
        return 0; // 'a' and 'b' are equal, no change in order
    });
    return temp;
};
