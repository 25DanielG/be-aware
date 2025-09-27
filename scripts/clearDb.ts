import Users from "../helpers/users";
import Announcers from "../helpers/journal";
import Journal from "../helpers/journal";

process.argv.forEach(async (val) => {
    switch (val) {
        case "--users":
            await Users.removeAll();
            break;
        case "--journal":
            await Journal.removeAll();
            break;
        default:
            await Users.removeAll();
            await Journal.removeAll();
            break;
    }
})