import Handlebars from "handlebars";
import config from "../config";

export default function () {
    Handlebars.registerHelper("shorthand", function (date) {
        return "(" + (date.getUTCMonth() + 1) + "/" + date.getUTCDate() + ")"
    });
    Handlebars.registerHelper("equals", function(str1, str2) {
        return str1.toString() == str2.toString();
    });
    Handlebars.registerHelper("upper", function(str) {
       return str.charAt(0).toUpperCase() + str.slice(1); 
    });
    Handlebars.registerHelper("and", function(c1, c2) {
        return c1 && c2;
    });
    Handlebars.registerHelper("or", function(c1, c2) {
        return c1 || c2;
    });
    Handlebars.registerHelper("not", function(c1) {
        return !c1;
    });
}