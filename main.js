function identity (a) {
    return a;
}

/** Returns new Photon.JS library instance, setting it up with the given options.
 * @param {object} obj The options for the new library, including a version, access token, debug mode, name of device, and id of device (all of which you can supply later).
 * @returns {object} A new library instance.
*/
function Photon(obj) {
    'use strict';

    if (obj.debug) console.debug(obj);

    /** The Photon.JS library, a close wrapper on the Spark Photon board's REST API. Note: jQuery is a necissary requirement for this library.  (although Zepto will probably also work)
     * @version 0.3
     * @namespace PhotonJS
    */
    var self = {
        /** This section contains some useful utility functions, as well as giving access to the control settings for the whole library.
         *  @namespace Settings
         *  @version 0.3
         *  @memberof PhotonJS
        */
        settings: {
            debug: obj.debug || false,
            save: function (k, v) {
                var s = v || this[k];
                this[k] = v;

                return s;
            },

            token: obj.token || '',
            authorized: obj.authorized || false,
            version: obj.version || 1,
            name: obj.name || '',
            id: obj.id || 0,

            /** Returns a url built from its arguments, by joining its arguments with a '/' and then adding the access token.
             *  @memberof PhotonJS.Settings
             *  @method url
             *  @param {...string} urlSection - The sections of the url, to be joined with a slash.
             *  @returns {string} A url.
            */
            url: function () {
                if (this.token === '') throw new Error("Undefined token.");
                var args = Array.prototype.slice.call(arguments);
                args.forEach(function (e) {
                    if (e === '' || e === 0 || e === undefined || e === null) {
                        throw new Error("Undefined or invalid section in path.");
                    }
                });
                var url = this.baseUrl + '/' + (args.join('/')) + '?access_token=' + this.token;

                if (this.debug) console.debug(url);

                return url;
            }
        },

        /** The Authorization section largely deals with access tokens, since access tokens are largely the only way to authorize yourself with a Photon board.
         *  @example
         *  Photon({ token: "<your access token>" }).authorization.list();
         *  @namespace Authorization
         *  @memberof PhotonJS
         *  @version 0.3
        */
        authorization: {
            /** Lists the access tokens that you have
             *  @memberof PhotonJS.Authorization
             *  @method list
             *  @returns {object[]} A list of access tokens.
            */
            list: function () {
                return $.get(this.settings.url('access_tokens'), identity);
            },

            /** Delete an access token.
             *  @memberof PhotonJS.Authorization
             *  @method url
             *  @param {string} tok - The access token you want to delete.
             *  @returns {boolean} True if sucessful.
             */
            delete: function (tok) {
                return $.ajax({
                    url: this.settings.url('access_tokens', tok),
                    type: 'delete',
                    success: function (d) {
                        return true;
                    }
                });
            }
        },

        /** This section deals with some of the most important aspects of the Photon, being able to access variables and funtions over the network. This section also deals with the management of multiple devices.
         *  @example
         *  Photon({ token: "<your access token>" }).devices.get(<The device id>, "SomeVar");
         *  @namespace Devices
         *  @memberof PhotonJS
         *  @version 0.3
        */
        devices: {
            /** Lists all your known Photon or Particle boards.
             *  @memberof PhotonJS.Devices
             *  @method list
             *  @returns {object[]} The devices.
            */
            list: function () {
                return $.get(this.settings.url('devices'), identity);
            },

            /** Gets information about a device.
             *  @memberof PhotonJS.Devices
             *  @method getInfo
             *  @param {string} id - The device's ID.
             *  @returns {object} The device's information.
            */
            getInfo: function (id) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);

                return $.get(this.settings.url('devices', id), identity);
            },

            /** Gets a variable from the REST API of the device.
             *  @memberof PhotonJS.Devices
             *  @method get
             *  @param {string} id - The device's ID.
             *  @param {string} v - The variable that you want.
             *  @returns {object} The variables info and value.
            */
            get: function (id, v) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);

                return $.get(this.settings.url('devices', id, v), identity);
            },

            /** Calls a function over the device's REST API.
             *  @memberof PhotonJS.Devices
             *  @method call
             *  @param {string} id - The device's ID.
             *  @param {string} name - The function's name.
             *  @param {string|number} arg - The function's argument.
             *  @returns {object} Some function and device information, as well as the function's return value.
            */
            call: function (id, name, arg) {
                this.settings.save('id', id);
                this.settings.save('name', name);
                if (this.settings.debug) console.debug(id);
                if (this.settings.debug) console.debug(name);

                return $.post(this.settings.url('devices', id, name), { arg: arg }, identity);
            }
        },

        /** The Events namespace does exactly what it sounds like. It deals with creating, deleting, finding and accessing event streams.
         *  @example
         *  Photon(<access token>).events.getStream(<some prefix>)
         *  @namespace Events
         *  @memberof PhotonJS
         *  @version 0.3
        */
        events: {
            /** Opens a stream of "Server Sent Events" for all public events and private events for your devices.
             * @memberof PhotonJS.Events
             * @method getStream
             * @param {string} prefix - The event prefix that you want.
             * @returns {object} Information about the event.
            */
            getStream: function (prefix) {
                if (prefix) {
                    if (this.settings.debug) console.debug(prefix);
                    return $.get(this.settings.url('events', prefix), identity);
                } else {
                    return $.get(this.settings.url('events'), identity);
                }
            },

            /** Opens a stream of "Server Sent Events" for all public <b>and private</b> events and private events for your devices.
             * @memberof PhotonJS.Events
             * @method getDevicesStream
             * @param {string} prefix - The event prefix that you want.
             * @returns {object} Information about the event.
            */
            getDevicesStream: function (prefix) {
                if (prefix) {
                    if (this.settings.debug) console.debug(prefix);
                    return $.get(this.settings.url('devices', 'events', prefix));
                } else {
                    return $.get(this.settings.url('devices', 'events'));
                }
            },

            /** Not to be confused with {@link PhotonJS.Events.getDevicesStream}, getDeviceStream gets all the public and private events for a <b>single</b> device.
             * @memberof PhotonJS.Events
             * @method getDeviceStream
             * @param {string} id - The ID of the device.
             * @param {string} prefix - The event prefix that you want.
             * @returns {object} Information about the event.
            */
            getDeviceStream: function (id, prefix) {
                this.settings.save('id', id);

                if (prefix) {
                    return $.get(this.settings.url('devices', id, 'events', prefix));
                } else {
                    return $.get(this.settings.url('devices', id, 'events'));
                }
            },

            /** This function publishes an event to all your devices, with a name and some data attached.
             * @memberof PhotonJS.Events
             * @method publish
             * @param {string} name - The name of your event.
             * @param {object} data - The data you want to attach to your event.
             * @param {boolean} p - Wether your event is private or public.
             * @param {number} [ttl] - How long the event should hang around.
             * @returns {object} Information about the event.
            */
            publish: function (name, data, p, ttl) {
                this.settings.save('name', name);
                if (this.settings.debug) console.debug(name);

                data = data || {};
                p = p || false;

                if (!data) throw new Error("You must provide data to send.");

                if (ttl) {
                    if (this.settings.debug) console.debug(JSON.stringify({ data: data,
                                                                            p: p,
                                                                            ttl: ttl }));
                    return $.post(this.settings.url('devices', 'events'),
                                  { data: data,
                                    p: p,
                                    ttl: ttl });
                } else {
                    if (this.settings.debug) console.debug(JSON.stringify({ data: data,
                                                                            p: p }));

                    return $.post(this.settings.url('devices', 'events'),
                                  { data: data,
                                    p: p });
                }
            }
        },

        /** The Firmware section is one of the less important namespaces, since you will normally flash your device using the online IDE, not through JavaScript. This section deals with flashing and updating code, as well as renaming devices.
         * @namespace Firmware
         * @memberof PhotonJS
         * @version 0.3
        */
        firmware: {
            /** Update a board.
             * @memberof PhotonJS.Firmware
             * @method update
             * @param {string} id - The ID of your device
            */
            update: function (id) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);

                return $.ajax({
                    url: this.settings.url('devices', id),
                    type: 'put'
                });
            },

            /** Rename a device.
             * @memberof PhotonJS.Firmware
             * @method rename
             * @param {string} id - The ID of your device
             * @param {string} name - The new name of your device.
            */
            rename: function (id, name) {
                this.settings.save('id', id);
                this.settings.save('name', name);

                if (this.settings.debug) console.debug(id);
                if (this.settings.debug) console.debug(name);

                return $.ajax({
                    url: this.settings.url('devices', id),
                    data: { name: name },
                    type: 'put'
                });
            },

            /** Flash a device with new code. PLEASE DO NOT USE THIS. THIS IS DANGEROUS, EXPEREMENTAL, AND NOT A GOOD IDEA.
             * @memberof PhotonJS.Firmware
             * @method flashSourceCode
             * @param {string} id - The ID of your device
             * @param {string} file - The code.
             * @deprecated since version 0.1
            */
            flashSourceCode: function (id, file) {
                var boundary = "---------------------------7da24f2e50046";
                var body = '--' + boundary + '\r\n'
                    + 'Content-Disposition: form-data; name="file";'
                    + 'filename="code.cpp"\r\n'
                    + 'Content-type: plain/text\r\n\r\n'
                    + data + '\r\n'
                    + '--'+ boundary + '--';
                if (this.settings.debug) console.debug(body);
                if (this.settings.debug) console.debug(id);

                if (!id) throw new Error("An id is necessary for flashing source code. The Flash was not successful.");
                if (!file) throw new Error("You need code to flash code to a device. The Flash was not successful.");

                return $.ajax({
                    url: this.settings.url('devices', id),
                    contentType: "multipart/form-data; boundary=" + boundary,
                    data: { file: body },
                    type: 'put'
                });
            }
        },

        /** This section deals with team members and orginizations.
         *  @namespace Orginizations
         *  @memberof PhotonJS
         *  @version 0.3
        */
        orginizations: {
            /** List your orginizations
             * @method list
             * @memberof PhotonJS.Orginizations
             * @returns {object[]} Your orginizations and there info.
            */
            list: function () {
                return $.get(this.settings.url('orgs'), identity); // orcs?
            },

            /** Get an orginization via its slug (identifier).
             * @method get
             * @memberof PhotonJS.Orginizations
             * @param {string} slug - The orginization that you want's slug.
             * @returns {object} Your orginization and their info.
            */
            get: function (slug) {
                if (this.settings.debug) console.debug(slug);
                return $.get(this.settings.url('orgs', slug), identity); // Orcs like slugs!
            },

           /** Get an orginization via its slug (identifier).
             * @method get
             * @memberof PhotonJS.Orginizations
             * @param {string} slug - The orginization that you want's slug.
             * @returns {object} Your orginization and its info.
            */
            removeTeamMember: function (slug, username) {
                this.settings.save('slug', slug);
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(username);

                return $.ajax({
                    type: 'delete',
                    url: this.settings.url('orgs', slug, 'users', username)
                });
            },
        },

        /** This section deals with products.
         *  @namespace Products
         *  @memberof PhotonJS
         *  @version 0.3
        */
        products: {
            /** Get an orginization via its slug, then get a product from that orginization, using another slug.
             * @method get
             * @memberof PhotonJS.Products
             * @param {string} slug - The orginization that you want's slug.
             * @param {string} pSlug - The slug of the product you want.
             * @returns {object} Your product and its info.
            */
            get: function (slug, pSlug) {
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(pSlug);

                return $.get(this.settings.url('orgs', slug, 'products', pSlug), identity);
            },

           /** Generate a claim code for a product.
             * @method genClaimCode
             * @memberof PhotonJS.Products
             * @param {string} slug - The orginization that you want's slug.
             * @param {string} pSlug - The slug of the product you want.
            */
            genClaimCode: function (slug, pSlug) {
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(pSlug);

                return $.post(this.settings.url('orgs', slug, 'products', pSlug, 'device_claims'), identity);
            },

            /** Remove a device from a product
             * @method removeDevice
             * @memberof PhotonJS.Products
             * @param {string} slug - The orginization that you want's slug.
             * @param {string} pSlug - The slug of the product you want.
             * @param {string} id - The ID of the device you want to remove.
            */
            removeDevice: function (slug, pSlug, id) {
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(pSlug);
                if (this.settings.debug) console.debug(id);

                return $.ajax({
                    type: 'delete',
                    url: this.settings.url('orgs', slug, 'products', pSlug, 'devices', id)
                });
            }
        }
    };

    self.auth.settings = Photon.settings;
    self.devices.settings = Photon.settings;
    self.firmware.settings = Photon.settings;
    self.products.settings = Photon.settings;
    self.orgs.settings = Photon.settings;
    self.settings.baseUrl = 'https://api.particle.io/v' + self.settings.version;
    if (obj.debug) console.debug(self.settings.baseUrl);

    return self;
}

