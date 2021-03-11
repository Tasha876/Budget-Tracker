// const databaseName = "budget-tracker";
// const storeName = "budget";

// const useOffline = (method, object) => {
//     return new Promise((resolve, reject) => {
//         const request = indexedDB.open(databaseName, 1)
//         let db,
//         tx,
//         store;
    
//         request.onupgradeneeded = (e) => {
//             console.log(e)
//             const db = request.result;
//             db.createObjectStore(storeName, { keyPath: "_id", autoIncrement: true});
//         };

//         request.onerror = function(e) {
//             console.log(`The following error occured ${e}`);
//             reject(e);
//           };

//           request.onsuccess = (e) => {
//             db = request.result;
//             tx = db.transaction(storeName, "readwrite");
//             store = tx.objectStore(storeName);

//           db.onerror = (e) => {
//             console.log("error");
//           };
//           switch(method) {
//               case "add":
//                 store.add(object);
//                 break;
//               case "put":
//                 store.put(object);
//                 break
//               case "clear":
//                 store.clear();
//                 console.log("sotre",store)
//                 break
//               case "get":
//                 const all = store.getAll();
//                 console.log(store)
//                 all.onsuccess = () => {
//                   resolve(all.result);
//                 };
//             }
//           tx.oncomplete = () => {
//             db.close();
//           };
//         }
//     });
// };