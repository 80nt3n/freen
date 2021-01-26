(() => {

  /*
  Store the calculated ciphertext here, so we can decrypt the message later.
  */
  let ciphertext;
  let mkey;

  /*
  Fetch the contents of the "message" textbox, and encode it
  in a form we can use for the encrypt operation.
  */


  function retrieveImageFromClipboardAsBlob(pasteEvent, callback) {
    if (pasteEvent.clipboardData == false) {
      if (typeof (callback) == "function") {
        callback(undefined);
      }
    };

    var items = pasteEvent.clipboardData.items;

    if (items == undefined) {
      if (typeof (callback) == "function") {
        callback(undefined);
        console.log("hello")
      }
    };

    for (var i = 0; i < items.length; i++) {
      // Skip content if not image
      if (items[i].type.indexOf("image") == -1) continue;
      // Retrieve image on clipboard as blob
      var blob = items[i].getAsFile();

      if (typeof (callback) == "function") {
        callback(blob);
      }
    }
  }


  function getMessageEncoding() {
    const messageBox = document.querySelector("#rsa-oaep-message");
    let message = messageBox.value;
    let enc = new TextEncoder();
    return enc.encode(message);
  }


  // fill the text box
  // first export the generated key
  /*
    Export the given key and write it into the "exported-key" space.
    */
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  /*
   Convert a string into an ArrayBuffer
   from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
   */
  function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  function removeLines(str) {
    return str.replace("\n", "");
  }



  async function exportCryptoKey_Private(key) {
    const exported = await window.crypto.subtle.exportKey(
      "pkcs8",
      key
    );
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const pemExported = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
    const mtextMessage = pemExported
    text_box_private = document.querySelector("#rsa-oaep-message_enckey_priv")
    text_box_private.textContent = mtextMessage
  }

  async function exportCryptoKey_Public(key) {
    const exported = await window.crypto.subtle.exportKey(
      "spki",
      key
    );
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
    const mtextMessage = pemExported
    text_box_public = document.querySelector("#rsa-oaep-message_enckey_pub")
    text_box_public.textContent = mtextMessage
  }

  /*
  Get the encoded message, encrypt it and display a representation
  of the ciphertext in the "Ciphertext" element.
  */
  async function encryptMessage(key) {
    let encoded = getMessageEncoding();
    ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      key,
      encoded
    );

    buffer = new Uint8Array(ciphertext, 0, 256);
    const ciphertextValue = document.querySelector(".rsa-oaep .ciphertext-value");
    ciphertextValue.classList.add('fade-in');
    ciphertextValue.addEventListener('animationend', () => {
      ciphertextValue.classList.remove('fade-in');
    });
    //ciphertextValue.textContent = `${btoa(buffer)}...[${ciphertext.byteLength} bytes total]`;

    const ciphertextValueBox = document.querySelector("#ciphertext_box");

    ciphertextValueBox.value = `${btoa(ab2str(ciphertext))}`;



  }

  /*
  Fetch the ciphertext and decrypt it.
  Write the decrypted message into the "Decrypted" box.
  */



  function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;

    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }


  async function decryptMessage(key) {
    const messageBox = document.querySelector("#ciphertext_box");
    enc_text = messageBox.value;
    enc_ab = _base64ToArrayBuffer(enc_text)

    let decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      key,
      enc_ab
    );

    let dec = new TextDecoder();
    const decryptedValue = document.querySelector(".rsa-oaep .decrypted-value");
    decryptedValue.classList.add('fade-in');
    decryptedValue.addEventListener('animationend', () => {
      decryptedValue.classList.remove('fade-in');
    });
    const decryptedtextBox = document.querySelector("#decryptedtext_box");
    decryptedtextBox.value = dec.decode(decrypted);
  }


  /*
     Import a PEM encoded RSA public key, to use for RSA-OAEP encryption.
     Takes a string containing the PEM encoded key, and returns a Promise
     that will resolve to a CryptoKey representing the public key.
     */
  function importPublicKey(pem) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["encrypt"]
    );
  }

  /*
    Import a PEM encoded RSA private key, to use for RSA-PSS signing.
    Takes a string containing the PEM encoded key, and returns a Promise
    that will resolve to a CryptoKey representing the private key.
    */
  function importPrivateKey(pem) {
    // fetch the part of the PEM string between header and footer
    //pem = removeLines(pem);
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";

    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);

    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-OAEP",
        // Consider using a 4096-bit key for systems that require long-term security
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  }

  /*
  Generate an encryption key pair, then set up event listeners
  on the "Encrypt" and "Decrypt" buttons.
  */
 /*
  window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      // Consider using a 4096-bit key for systems that require long-term security
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  ).then((keyPair) => {
    const encryptButton = document.querySelector(".rsa-oaep .encrypt-button");
    encryptButton.addEventListener("click", () => {
      encryptMessage(keyPair.publicKey);
      exportCryptoKey_Private(keyPair.privateKey);
      exportCryptoKey_Public(keyPair.publicKey);
    });

    const decryptButton = document.querySelector(".rsa-oaep .decrypt-button");
    decryptButton.addEventListener("click", () => {
      const priv_key = document.querySelector("#rsa-oaep-message_enckey_priv")
      pemEncodedKey = priv_key.value;


      decriptkey = importPrivateKey(pemEncodedKey).then(function (value) { decryptMessage(value) });

    });
  });

*/



  window.addEventListener("paste", function (e) {

    // Handle the event
    retrieveImageFromClipboardAsBlob(e, function (imageBlob) {
      // If there's an image, display it in the canvas
      if (imageBlob) {
        var canvas = document.getElementById("mycanvas3");
        var ctx = canvas.getContext('2d');
        
        // Create an image to render the blob on the canvas
        var img = new Image();

        // Once the image loads, render the img on the canvas
        img.onload = function () {
          // Update dimensions of the canvas with the dimensions of the image
          canvas.width = this.width;
          canvas.height = this.height;

          // Draw the image

          ctx.drawImage(img, 0, 0)
          var imgData = ctx.getImageData(0, 0, 400, 300).data;
          var n = 0;
          var b64PaddingPos = imgData.indexOf(18) + 1;
          var cypherTextArr = imgData.slice(0, b64PaddingPos);
          var cypherTextStr, cypherTextChar = null;

          let extract_cypher = new Promise(function (myResolve, myReject) {
            for (i = 0; i <= cypherTextArr.length; i = i + 4) {

              cypherTextChar = String.fromCharCode(cypherTextArr[i] + 43)


              cypherTextStr = cypherTextStr + cypherTextChar


            }
            cypherText = cypherTextStr.replace("undefined", "");
            myResolve(cypherText)
          })
          extract_cypher.then(function (value) {
            const messageBox = document.querySelector("#ciphertext_box");
            messageBox.value = value
            enc_text = messageBox.value; console.log(enc_text)
            const decryptButton = document.querySelector(".rsa-oaep .decrypt-button");
            decryptButton.addEventListener("click", () => {
              const priv_key = document.querySelector("#rsa-oaep-message_enckey_priv")
              pemEncodedKey = priv_key.value;


              decriptkey = importPrivateKey(pemEncodedKey).then(function (value) { decryptMessage(value) });

            });
          })

        }

      };

      // Crossbrowser support for URL
      var URLObj = window.URL || window.webkitURL;

      // Creates a DOMString containing a URL representing the object given in the parameter
      // namely the original Blob
      img.src = URLObj.createObjectURL(imageBlob);


    }
    );
  }, false);










})();