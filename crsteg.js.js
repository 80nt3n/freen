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
    var b64_ciph_text = btoa(ab2str(ciphertext))
    create_image(b64_ciph_text)

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


  function create_image(img_data) {
    console.log(img_data.length)

    /* draw to canvas  -> steg*/
    var c = document.getElementById("myCanvas2");
    var ctx = c.getContext("2d");
    var string_vector = 0 // processing vector ciphertext
    var cipher_text_length = img_data.length
    for (k = 0; k < 100; k++) {
      for (i = 0; i < 100; i++) {
        if (string_vector <= cipher_text_length) {
          r = img_data.slice(string_vector, string_vector + 1).charCodeAt(0)-43
          // convert b64 string to rgb value from derivation ascii code 
          // decrease value by 43 for the sake of less volatility -> noise in 
          // image
          g = 180
          b = r
          console.log(r,g,b,img_data[string_vector])
        }
        else {
          r = Math.floor(Math.random() * 64); //base64
          if (r=61) {r=60} // exclude b64 padding ("=")
          g = 180
          b = r
          
        }
        string_vector++
        color_string = "rgb" + "(" + r.toString() + "," + g.toString() + "," + b.toString() + ")"
        ctx.fillStyle = color_string
        ctx.fillRect(i, k, 1, 1);
      }
    }



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
      console.log("hello")
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

})();