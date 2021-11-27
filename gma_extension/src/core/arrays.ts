import { IFolder } from "../models";

export const sortFolders = function (obj1: IFolder, obj2: IFolder)  {
    if (obj1.uri.path > obj2.uri.path) {
        return 1;
    }

    if (obj1.uri.path < obj2.uri.path) {
        return -1;
    }

    return 0;
}
