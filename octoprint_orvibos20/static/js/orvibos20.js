/*
 * View model for OctoPrint-OrviboS20
 *
 * Author: cprasmu
 * License: AGPLv3
 */
$(function() {
    function orvibos20ViewModel(parameters) {
        var self = this;

        self.settings = parameters[0];
		self.loginState = parameters[1];

		self.arrSmartplugs = ko.observableArray();
		self.isPrinting = ko.observable(false);
		self.selectedPlug = ko.observable();
		self.processing = ko.observableArray([]);

		self.onBeforeBinding = function() {
			self.arrSmartplugs(self.settings.settings.plugins.orvibos20.arrSmartplugs());
        }

		self.onAfterBinding = function() {
			self.checkStatuses();
		}

        self.onEventSettingsUpdated = function(payload) {
			self.arrSmartplugs(self.settings.settings.plugins.orvibos20.arrSmartplugs());
		}

		self.onEventPrinterStateChanged = function(payload) {
			if (payload.state_id == "PRINTING" || payload.state_id == "PAUSED"){
				self.isPrinting(true);
			} else {
				self.isPrinting(false);
			}
		}

		self.cancelClick = function(data) {
			self.processing.remove(data.ip());
		}

		self.editPlug = function(data) {
			self.selectedPlug(data);
			$("#OrviboS20Editor").modal("show");
		}

		self.addPlug = function() {
			self.selectedPlug({'ip':ko.observable(''),
									'label':ko.observable(''),
									'icon':ko.observable('icon-bolt'),
									'displayWarning':ko.observable(true),
									'warnPrinting':ko.observable(false),
									'gcodeEnabled':ko.observable(false),
									'gcodeOnDelay':ko.observable(0),
									'gcodeOffDelay':ko.observable(0),
									'autoConnect':ko.observable(true),
									'autoConnectDelay':ko.observable(10.0),
									'autoDisconnect':ko.observable(true),
									'autoDisconnectDelay':ko.observable(0),
									'sysCmdOn':ko.observable(false),
									'sysRunCmdOn':ko.observable(''),
									'sysCmdOnDelay':ko.observable(0),
									'sysCmdOff':ko.observable(false),
									'sysRunCmdOff':ko.observable(''),
									'sysCmdOffDelay':ko.observable(0),
									'currentState':ko.observable('unknown'),
									'btnColor':ko.observable('#808080'),
									'useCountdownRules':ko.observable(false),
									'countdownOnDelay':ko.observable(0),
									'countdownOffDelay':ko.observable(0)});
			self.settings.settings.plugins.orvibos20.arrSmartplugs.push(self.selectedPlug());
			$("#OrviboS20Editor").modal("show");
		}

		self.removePlug = function(row) {
			self.settings.settings.plugins.orvibos20.arrSmartplugs.remove(row);
		}

		self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "orvibos20") {
                return;
            }

			plug = ko.utils.arrayFirst(self.settings.settings.plugins.orvibos20.arrSmartplugs(),function(item){
				return item.ip() === data.ip;
				}) || {'ip':data.ip,'currentState':'unknown','btnColor':'#808080'};

			if (plug.currentState != data.currentState) {
				plug.currentState(data.currentState)
				switch(data.currentState) {
					case "on":
						break;
					case "off":
						break;
					default:
						new PNotify({
							title: 'Orvibo S20 Socket Error',
							text: 'Status ' + plug.currentState() + ' for ' + plug.ip() + '. Double check IP Address\\Hostname in OrviboS20 Settings.',
							type: 'error',
							hide: true
							});
				self.settings.saveData();
				}
			}
			self.processing.remove(data.ip);
        };

		self.toggleRelay = function(data) {
			self.processing.push(data.ip());
			switch(data.currentState()){
				case "on":
					self.turnOff(data);
					break;
				case "off":
					self.turnOn(data);
					break;
				default:
					self.checkStatus(data.ip());
			}
		}

		self.turnOn = function(data) {
/* 			if(data.sysCmdOn()){
				setTimeout(function(){self.sysCommand(data.sysRunCmdOn())},data.sysCmdOnDelay()*1000);
			} */
			self.sendTurnOn(data);
		}

		self.sendTurnOn = function(data) {
            $.ajax({
                url: API_BASEURL + "plugin/orvibos20",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "turnOn",
					ip: data.ip()
                }),
                contentType: "application/json; charset=UTF-8"
            });
        };

    	self.turnOff = function(data) {
			if((data.displayWarning() || (self.isPrinting() && data.warnPrinting())) && !$("#OrviboS20Warning").is(':visible')){
				self.selectedPlug(data);
				$("#OrviboS20Warning").modal("show");
			} else {
				$("#OrviboS20Warning").modal("hide");
/* 				if(data.sysCmdOff()){
					setTimeout(function(){self.sysCommand(data.sysRunCmdOff())},data.sysCmdOffDelay()*1000);
				} */
				self.sendTurnOff(data);
			}
        };

		self.sendTurnOff = function(data) {
			$.ajax({
			url: API_BASEURL + "plugin/orvibos20",
			type: "POST",
			dataType: "json",
			data: JSON.stringify({
				command: "turnOff",
				ip: data.ip()
			}),
			contentType: "application/json; charset=UTF-8"
			});
		}

		self.checkStatus = function(plugIP) {
            $.ajax({
                url: API_BASEURL + "plugin/orvibos20",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "checkStatus",
					ip: plugIP
                }),
                contentType: "application/json; charset=UTF-8"
            }).done(function(){
				self.settings.saveData();
				});
        };

		self.disconnectPrinter = function() {
            $.ajax({
                url: API_BASEURL + "plugin/orvibos20",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "disconnectPrinter"
                }),
                contentType: "application/json; charset=UTF-8"
            });
		}

		self.connectPrinter = function() {
            $.ajax({
                url: API_BASEURL + "plugin/orvibos20",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "connectPrinter"
                }),
                contentType: "application/json; charset=UTF-8"
            });
		}

/* 		self.sysCommand = function(sysCmd) {
            $.ajax({
                url: API_BASEURL + "plugin/orvibos20",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "sysCommand",
					cmd: sysCmd
                }),
                contentType: "application/json; charset=UTF-8"
            });
		} */

		self.checkStatuses = function() {
			ko.utils.arrayForEach(self.settings.settings.plugins.orvibos20.arrSmartplugs(),function(item){
				if(item.ip() !== "") {
					console.log("checking " + item.ip())
					self.checkStatus(item.ip());
				}
			});
			if (self.settings.settings.plugins.orvibos20.pollingEnabled()) {
				setTimeout(function() {self.checkStatuses();}, (parseInt(self.settings.settings.plugins.orvibos20.pollingInterval(),10) * 60000));
			};
        };
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        orvibos20ViewModel,

        // e.g. loginStateViewModel, settingsViewModel, ...
        ["settingsViewModel","loginStateViewModel"],

        // "#navbar_plugin_orvibos20","#settings_plugin_orvibos20"
        ["#navbar_plugin_orvibos20","#settings_plugin_orvibos20"]
    ]);
});
