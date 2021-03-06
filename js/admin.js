// Whether the broswer supports WebAuthn
if (window.PublicKeyCredential === undefined || navigator.credentials.create === undefined || typeof navigator.credentials.create !== "function") {
    jQuery("#bind, #test").attr('disabled', 'disabled');
    jQuery('#show-progress').html(php_vars.i18n_5);
}

jQuery(function(){
    updateList();
    let div = document.getElementById("wwa_log");
    if(div !== null){
        div.scrollTop = div.scrollHeight;
        if(jQuery("#wwa-remove-log").length === 0){
            setInterval(() => {
                updateLog();
            }, 5000);
        }
    }
})

// Update authenticator list
function updateList(){
    jQuery.ajax({
        url: php_vars.ajax_url,
        type: 'GET',
        data: {
            action: 'wwa_authenticator_list'
        },
        success: function(data){
            if(typeof data === "string"){
                console.warn(data);
                jQuery("#authenticator-list").html('<tr><td colspan="'+(jQuery(".usernameless-th").css("display") === "none" ? "5" : "6")+'">'+php_vars.i18n_8+'</td></tr>');
                return;
            }
            if(data.length === 0){
                if(configs.usernameless === "true"){
                    jQuery(".usernameless-th, .usernameless-td").show();
                }else{
                    jQuery(".usernameless-th, .usernameless-td").hide();
                }
                jQuery("#authenticator-list").html('<tr><td colspan="'+(jQuery(".usernameless-th").css("display") === "none" ? "5" : "6")+'">'+php_vars.i18n_17+'</td></tr>');
                jQuery("#usernameless_tip").text("");
                jQuery("#usernameless_tip").hide();
                return;
            }
            let htmlStr = "";
            let has_usernameless = false;
            for(item of data){
                if(item.usernameless){
                    has_usernameless = true;
                }
                htmlStr += '<tr><td>'+item.name+'</td><td>'+(item.type === "none" ? php_vars.i18n_9 : (item.type === "platform" ? php_vars.i18n_10 : php_vars.i18n_11))+'</td><td>'+item.added+'</td><td>'+item.last_used+'</td><td class="usernameless-td">'+(item.usernameless ? php_vars.i18n_24+(configs.usernameless === "true" ? "" : php_vars.i18n_26) : php_vars.i18n_25)+'</td><td id="'+item.key+'"><a href="javascript:renameAuthenticator(\''+item.key+'\', \''+item.name+'\')">'+php_vars.i18n_20+'</a> | <a href="javascript:removeAuthenticator(\''+item.key+'\', \''+item.name+'\')">'+php_vars.i18n_12+'</a></td></tr>';
            }
            jQuery("#authenticator-list").html(htmlStr);
            if(has_usernameless || configs.usernameless === "true"){
                jQuery(".usernameless-th, .usernameless-td").show();
            }else{
                jQuery(".usernameless-th, .usernameless-td").hide();
            }
            if(has_usernameless && configs.usernameless !== "true"){
                jQuery("#usernameless_tip").text(php_vars.i18n_27);
                jQuery("#usernameless_tip").show();
            }else{
                jQuery("#usernameless_tip").text("");
                jQuery("#usernameless_tip").hide();
            }
        },
        error: function(){
            jQuery("#authenticator-list").html('<tr><td colspan="'+(jQuery(".usernameless-th").css("display") === "none" ? "5" : "6")+'">'+php_vars.i18n_8+'</td></tr>');
        }
    })
}

// Update log
function updateLog(){
    if(jQuery("#wwa_log").length === 0){
        return;
    }
    jQuery.ajax({
        url: php_vars.ajax_url,
        type: 'GET',
        data: {
            action: 'wwa_get_log'
        },
        success: function(data){
            if(typeof data === "string"){
                console.warn(data);
                jQuery("#wwa_log").text(php_vars.i18n_8);
                return;
            }
            if(data.length === 0){
                document.getElementById("clear_log").disabled = true;
                jQuery("#wwa_log").text("");
                jQuery("#wwa-remove-log").remove();
                jQuery("#log-count").text(php_vars.i18n_23+"0");
                return;
            }
            document.getElementById("clear_log").disabled = false;
            let data_str = data.join("\n");
            if(data_str !== jQuery("#wwa_log").text()){
                jQuery("#wwa_log").text(data_str);
                jQuery("#log-count").text(php_vars.i18n_23+data.length);
                let div = document.getElementById("wwa_log");
                div.scrollTop = div.scrollHeight;
            }
        },
        error: function(){
            jQuery("#wwa_log").text(php_vars.i18n_8);
        }
    })
}

/** Code Base64URL into Base64
 * 
 * @param {string} input Base64URL coded string
 */
function base64url2base64(input) {
    input = input.replace(/=/g, "").replace(/-/g, '+').replace(/_/g, '/');
    const pad = input.length % 4;
    if(pad) {
        if(pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        input += new Array(5-pad).join('=');
    }
    return input;
}

/** Code Uint8Array into Base64 string
 * 
 * @param {Uint8Array} a The Uint8Array needed to be coded into Base64 string
 */
function arrayToBase64String(a) {
    return btoa(String.fromCharCode(...a));
}

// Bind an authenticator
jQuery("#bind").click(function(){
    if(jQuery("#authenticator_name").val() === ""){
        alert(php_vars.i18n_7);
        return;
    }

    // Disable inputs to avoid changing in process
    jQuery('#show-progress').html(php_vars.i18n_1);
    jQuery("#bind").attr('disabled', 'disabled');
    jQuery("#authenticator_name").attr('disabled', 'disabled');
    jQuery(".authenticator_usernameless").attr('disabled', 'disabled');
    jQuery("#authenticator_type").attr('disabled', 'disabled');
    jQuery.ajax({
        url: php_vars.ajax_url,
        type: 'GET',
        data: {
            action: 'wwa_create',
            name: jQuery("#authenticator_name").val(),
            type: jQuery("#authenticator_type").val(),
            usernameless: jQuery(".authenticator_usernameless:checked").val() ? jQuery(".authenticator_usernameless:checked").val() : "false"
        },
        success: function(data){
            if(typeof data === "string"){
                console.warn(data);
                jQuery('#show-progress').html(php_vars.i18n_4+": "+data);
                jQuery("#bind").removeAttr('disabled');
                jQuery("#authenticator_name").removeAttr('disabled');
                jQuery(".authenticator_usernameless").removeAttr('disabled');
                jQuery("#authenticator_type").removeAttr('disabled');
                updateList();
                return;
            }
            // Get the args, code string into Uint8Array
            jQuery('#show-progress').text(php_vars.i18n_2);
            let challenge = new Uint8Array(32);
            let user_id = new Uint8Array(32);
            challenge = Uint8Array.from(window.atob(base64url2base64(data.challenge)), c=>c.charCodeAt(0));
            user_id = Uint8Array.from(window.atob(base64url2base64(data.user.id)), c=>c.charCodeAt(0));

            let public_key = {
                challenge: challenge,
                rp: {
                    id: data.rp.id,
                    name: data.rp.name
                },
                user: {
                    id: user_id,
                    name: data.user.name,
                    displayName: data.user.displayName
                },
                pubKeyCredParams: data.pubKeyCredParams,
                authenticatorSelection: data.authenticatorSelection,
                timeout: data.timeout
            }

            // If some authenticators are already registered, exclude
            if(data.excludeCredentials){
                public_key.excludeCredentials = data.excludeCredentials.map(function(item){
                    item.id = Uint8Array.from(window.atob(base64url2base64(item.id)), function(c){return c.charCodeAt(0);});
                    return item;
                })
            }

            // Create, a pop-up window should appear
            navigator.credentials.create({ 'publicKey': public_key }).then((newCredentialInfo) => {
                jQuery('#show-progress').html(php_vars.i18n_6);
                return newCredentialInfo;
            }).then(function(data){
                // Code Uint8Array into string for transmission
                const publicKeyCredential = {
                    id: data.id,
                    type: data.type,
                    rawId: arrayToBase64String(new Uint8Array(data.rawId)),
                    response: {
                        clientDataJSON: arrayToBase64String(new Uint8Array(data.response.clientDataJSON)),
                        attestationObject: arrayToBase64String(new Uint8Array(data.response.attestationObject))
                    }
                };
                return publicKeyCredential;
            }).then(JSON.stringify).then(function(AuthenticatorAttestationResponse) {
                // Send attestation back to RP
                jQuery.ajax({
                    url: php_vars.ajax_url+"?action=wwa_create_response",
                    type: 'POST',
                    data: {
                        data: window.btoa(AuthenticatorAttestationResponse),
                        name: jQuery("#authenticator_name").val(),
                        type: jQuery("#authenticator_type").val(),
                        usernameless: jQuery(".authenticator_usernameless:checked").val() ? jQuery(".authenticator_usernameless:checked").val() : "false"
                    },
                    success: function(data){
                        if(data === "true"){
                            // Registered
                            jQuery('#show-progress').html(php_vars.i18n_3);
                            jQuery("#bind").removeAttr('disabled');
                            jQuery("#authenticator_name").removeAttr('disabled');
                            jQuery("#authenticator_name").val("");
                            jQuery(".authenticator_usernameless").removeAttr('disabled');
                            jQuery("#authenticator_type").removeAttr('disabled');
                            updateList();
                        }else{
                            // Register failed
                            jQuery('#show-progress').html(php_vars.i18n_4);
                            jQuery("#bind").removeAttr('disabled');
                            jQuery("#authenticator_name").removeAttr('disabled');
                            jQuery(".authenticator_usernameless").removeAttr('disabled');
                            jQuery("#authenticator_type").removeAttr('disabled');
                            updateList();
                        }
                    },
                    error: function(){
                        jQuery('#show-progress').html(php_vars.i18n_4);
                        jQuery("#bind").removeAttr('disabled');
                        jQuery("#authenticator_name").removeAttr('disabled');
                        jQuery(".authenticator_usernameless").removeAttr('disabled');
                        jQuery("#authenticator_type").removeAttr('disabled');
                        updateList();
                    }
                })
            }).catch((error) => {
                // Creation abort
                console.warn(error);
                jQuery('#show-progress').html(php_vars.i18n_4+": "+error);
                jQuery("#bind").removeAttr('disabled');
                jQuery("#authenticator_name").removeAttr('disabled');
                jQuery(".authenticator_usernameless").removeAttr('disabled');
                jQuery("#authenticator_type").removeAttr('disabled');
                updateList();
            })
        },
        error: function(){
            jQuery('#show-progress').html(php_vars.i18n_4);
            jQuery("#bind").removeAttr('disabled');
            jQuery("#authenticator_name").removeAttr('disabled');
            jQuery(".authenticator_usernameless").removeAttr('disabled');
            jQuery("#authenticator_type").removeAttr('disabled');
            updateList();
        }
    })
});

// Test WebAuthn
jQuery("#test, #test_usernameless").click(function(){
    jQuery("#test, #test_usernameless").attr("disabled", "disabled");
    let button_id = this.id;
    let usernameless = "false";
    let tip_id = "#show-test";
    if(button_id === "test_usernameless"){
        usernameless = "true";
        tip_id = "#show-test-usernameless";
    }
    jQuery(tip_id).text(php_vars.i18n_1);
    jQuery.ajax({
        url: php_vars.ajax_url,
        type: 'GET',
        data: {
            action: 'wwa_auth_start',
            type: 'test',
            usernameless: usernameless
        },
        success: function(data){
            if(typeof data === "string"){
                console.warn(data);
                jQuery(tip_id).html(php_vars.i18n_15+": "+data);
                jQuery("#test, #test_usernameless").removeAttr('disabled');
                return;
            }
            if(data === "User not inited."){
                jQuery(tip_id).html(php_vars.i18n_15+": "+php_vars.i18n_17);
                jQuery("#test, #test_usernameless").removeAttr('disabled');
                return;
            }
            jQuery(tip_id).text(php_vars.i18n_13);
            data.challenge = Uint8Array.from(window.atob(base64url2base64(data.challenge)), c=>c.charCodeAt(0));

            if (data.allowCredentials) {
                data.allowCredentials = data.allowCredentials.map(function(item) {
                    item.id = Uint8Array.from(window.atob(base64url2base64(item.id)), function(c){return c.charCodeAt(0);});
                    return item;
                });
            }

            navigator.credentials.get({ 'publicKey': data }).then((credentialInfo) => {
                jQuery(tip_id).html(php_vars.i18n_14);
                return credentialInfo;
            }).then(function(data) {
                const publicKeyCredential = {
                    id: data.id,
                    type: data.type,
                    rawId: arrayToBase64String(new Uint8Array(data.rawId)),
                    response: {
                        authenticatorData: arrayToBase64String(new Uint8Array(data.response.authenticatorData)),
                        clientDataJSON: arrayToBase64String(new Uint8Array(data.response.clientDataJSON)),
                        signature: arrayToBase64String(new Uint8Array(data.response.signature)),
                        userHandle: data.response.userHandle ? arrayToBase64String(new Uint8Array(data.response.userHandle)) : null
                    }
                };
                return publicKeyCredential;
            }).then(JSON.stringify).then(function(AuthenticatorResponse) {
                jQuery.ajax({
                    url: php_vars.ajax_url+"?action=wwa_auth",
                    type: 'POST',
                    data: {
                        data: window.btoa(AuthenticatorResponse),
                        type: 'test'
                    },
                    success: function(data){
                        if(data === "true"){
                            jQuery(tip_id).html(php_vars.i18n_16);
                            jQuery("#test, #test_usernameless").removeAttr('disabled');
                            updateList();
                        }else{
                            jQuery(tip_id).html(php_vars.i18n_15);
                            jQuery("#test, #test_usernameless").removeAttr('disabled');
                        }
                    },
                    error: function(){
                        jQuery(tip_id).html(php_vars.i18n_15);
                        jQuery("#test, #test_usernameless").removeAttr('disabled');
                    }
                })
            }).catch((error) => {
                console.warn(error);
                jQuery(tip_id).html(php_vars.i18n_15+": "+error);
                jQuery("#test, #test_usernameless").removeAttr('disabled');
            })
        },
        error: function(){
            jQuery(tip_id).html(php_vars.i18n_15);
            jQuery("#test, #test_usernameless").removeAttr('disabled');
        }
    })
});

/**
 * Rename an authenticator
 * @param {string} id Authenticator ID
 * @param {string} name Current authenticator name
 */
function renameAuthenticator(id, name){
    let new_name = prompt(php_vars.i18n_21, name);
    if(new_name === ""){
        alert(php_vars.i18n_7);
    }else if(new_name !== null && new_name !== name){
        jQuery("#"+id).text(php_vars.i18n_22)
        jQuery.ajax({
            url: php_vars.ajax_url,
            type: 'GET',
            data: {
                action: 'wwa_modify_authenticator',
                id: id,
                name: new_name,
                target: 'rename'
            },
            success: function(){
                updateList();
            },
            error: function(data){
                alert("Error: "+data);
                updateList();
            }
        })
    }
}

/**
 * Remove an authenticator
 * @param {string} id Authenticator ID
 * @param {string} name Authenticator name
 */
function removeAuthenticator(id, name){
    if(confirm(php_vars.i18n_18+name+(jQuery("#authenticator-list > tr").length === 1 ? "\n"+php_vars.i18n_28 : ""))){
        jQuery("#"+id).text(php_vars.i18n_19)
        jQuery.ajax({
            url: php_vars.ajax_url,
            type: 'GET',
            data: {
                action: 'wwa_modify_authenticator',
                id: id,
                target: 'remove'
            },
            success: function(){
                updateList();
            },
            error: function(data){
                alert("Error: "+data);
                updateList();
            }
        })
    }
}

// Clear log
jQuery("#clear_log").click(function(e){
    e.preventDefault();
    document.getElementById("clear_log").disabled = true;
    jQuery.ajax({
        url: php_vars.ajax_url,
        type: 'GET',
        data: {
            action: 'wwa_clear_log'
        },
        success: function(){
            updateLog();
        },
        error: function(data){
            document.getElementById("clear_log").disabled = false;
            alert("Error: "+data);
            updateLog();
        }
    })
})