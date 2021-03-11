const databaseName = "budget-tracker";
const storeName = "budget";

const useOffline = (method, object) => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1)
        let db,
        tx,
        store;
    
        request.onupgradeneeded = (e) => {
            console.log(e)
            const db = request.result;
            db.createObjectStore(storeName, { keyPath: "_id", autoIncrement: true});
        };

        request.onerror = function(e) {
            console.log(`The following error occured ${e}`);
            reject(e);
          };

          request.onsuccess = (e) => {
            db = request.result;
            tx = db.transaction(storeName, "readwrite");
            store = tx.objectStore(storeName);

          db.onerror = (e) => {
            console.log("error");
          };
          switch(method) {
              case "add":
                store.add(object);
                break;
              case "put":
                store.put(object);
                break
              case "clear":
                store.clear();
                // console.log("store",store)
                break
              case "get":
                const all = store.getAll();
                // console.log(store)
                all.onsuccess = () => {
                  resolve(all.result);
                };
            }
          tx.oncomplete = () => {
            db.close();
          };
        }
    });
};

// install event handler
self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('static').then( cache => {
        return cache.addAll([
            '/index.html',
            '/icons/icon-192x192.png',
            '/icons/icon-512x512.png',
            '/index.js',
            '/styles.css',
            ]);
      })
    );
    console.log('Install');
    self.skipWaiting();
  });

  // retrieve assets from cache
  self.addEventListener('fetch', event => {
    switch (event.request.method) {
      case 'GET':
        synchronize()
        event.respondWith(
          caches.match(event.request).then(response => {
            return response || fetch(event.request);
          })
        );
        break;
      case 'POST':
        event.respondWith(fetch(event.request)
        .then(response => {
          console.log(response)
        return response
      })
      )
    }
    
  });

const synchronize = () => {


  useOffline("get")
  .then(txs => {
      console.log("here")
      txs.forEach(transaction => {
        if (transaction.delete) {
          self.fetch("/api/transaction/" + transaction._id, {
            method: "DELETE",
          })
        } else {
          // toKeep.push(transaction)
          console.log("transaction",transaction)
          self.fetch("api/transaction", {
          method: "POST",
          body: JSON.stringify({
              name: transaction.name,
              value: transaction.value,
              date: transaction.date,
              }),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
          })
        }
      })
    })
    .then(useOffline("clear"))
}

console.log("hello from service worker")
  
