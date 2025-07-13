/**
 * Plugin JQuery para trabalhar com anexos nos formulários dentro do processo
 *
 * @author Bruno Gasparetto
 * @see https://github.com/brunogasparetto/fluig-form-attachment
 */


/**
 * Configurações
 *
 * @typedef AttachmentSettings
 * @property {boolean} showActionButton Exibe o botão de upload/delete. True por padrão.
 * @property {boolean} filename Nome que será salvo como descrição do Anexo.
 * @property {boolean|string} prefixName Adiciona prefixo ao anexo. False por padrão, True para prefixo aleatório, String para prefixo fixo.
 * @property {string} accept Tipos de arquivos aceitos. Segue a regra do accept do input tipo file.
 */

;(function ($) {
    "use strict";

    const pluginName = "fluigFormAttachment";

    const isString = item => typeof item === "string";

    /**
     * Procura o índice do anexo de acordo com sua descrição
     *
     * @param {string} filename
     * @returns {number} -1 se não encontrar
     */
    const attachmentFindIndex = (filename) => parent.ECM.attachmentTable.getData().findIndex(attachment => attachment.description === filename);

    /**
     * Configuração padrão
     *
     * @type {AttachmentSettings}
     */
    const defaults = {
        showActionButton: true,
        filename: "Anexo",
        prefixName: false,
        accept: "*",
    };

    class Plugin {
        /**
         * @type {AttachmentSettings}
         */
        #settings;

        /**
         * Elemento do arquivo. Pode ser um input ou span (no modo leitura).
         *
         * @type {JQuery<HTMLElement>}
         */
        #input;

        /**
         * @type {JQuery<HTMLElement>}
         */
        #container;

        /**
         * @type {string}
         */
        #attachmentFilename;

        /**
         * @param {HTMLElement} element
         * @param {AttachmentSettings} options
         */
        constructor(element, options) {

            // Garantir um ID para o Input
            if (!element.id && element.nodeName.toLowerCase() === "input") {
                element.id = FLUIGC.utilities.randomUUID();
            }

            this.#settings = $.extend({}, defaults, options);
            this.#input = $(element);
            this.#attachmentFilename = this.#input.val() || this.#input.text().trim();

            this.#input
                .prop("readonly", true)
                .on("change", () => {
                    this.#attachmentFilename = this.#input.val();
                    this.#changeButtonsState();
                })
                .wrap(`<div class="${pluginName}Component"></div>`)
                .after(`<div class="${pluginName}Component_buttons">${this.#getButtonsTemplate()}</div>`);

            this.#container = this.#input.closest(`.${pluginName}Component`);

            this.#container
                .on("click", `.${pluginName}BtnDeleteFile`, () => this.#confirmDeleteAttachment())
                .on("click", `.${pluginName}BtnUpuloadFile`, () => this.#uploadAttachment())
                .on("click", `.${pluginName}BtnViewerFile`, () => this.#viewAttachment())
            ;
        }

        /**
         * Indica que o campo está válido
         *
         * Caso o campo possua algum valor é obrigatório que o anexo
         * esteja na tabela de anexos.
         *
         * @returns {boolean}
         */
        isValid() {
            return this.#attachmentFilename.length
                ? this.hasAttachment()
                : true
            ;
        }

        /**
         * Indica se o anexo está na tabela de anexos
         *
         * @returns {boolean}
         */
        hasAttachment() {
            const filename = this.#attachmentFilename || this.#input.val() || this.#input.text().trim();

            return filename.length > 0 && attachmentFindIndex(filename) !== -1;
        }

        /**
         * Remove o anexo
         *
         * Método útil para excluir anexos em tabela Pai x Filho.
         */
        deleteAttachment() {
            const attachmentIndex = parent.ECM.attachmentTable.getData().findIndex(
                attachment => attachment.description === this.#attachmentFilename
            );

            setTimeout(() => this.#input.val("").trigger("change"), 500);

            if (attachmentIndex === -1) {
                return;
            }

            parent.WKFViewAttachment.removeAttach([attachmentIndex]);
        }

        showActionButton() {
            this.#settings.showActionButton = true;
            this.#input.trigger("change");
        }

        hideActionButton() {
            this.#settings.showActionButton = false;
            this.#input.trigger("change");
        }

        filename(fileName, prefixName) {
            if (fileName === undefined) {
                return this.#input.data("filename") || this.#settings.filename;
            }

            this.#settings.filename = fileName;
            this.#input.data("filename", fileName);

            if (prefixName !== undefined) {
                this.prefixName(prefixName);
            }
        }

        prefixName(prefixName) {
            if (prefixName === undefined) {
                return this.#settings.prefixName;
            }

            this.#settings.prefixName = prefixName;
        }

        #getButtonsTemplate() {
            const hasFileSelected = this.#attachmentFilename.length !== 0;
            const canShowActionButton = this.#canDisplayActionButton();

            return `<button type="button" class="${pluginName}BtnAction ${pluginName}BtnDeleteFile btn btn-danger btn-sm ${(canShowActionButton && hasFileSelected) ? '' : 'hide'}" title="Remover Anexo"><i class="flaticon flaticon-trash icon-sm"></i></button>`
                + `<button type="button" class="${pluginName}BtnAction ${pluginName}BtnUpuloadFile btn btn-success btn-sm ${(canShowActionButton && !hasFileSelected) ? '' : 'hide'}" title="Enviar Anexo"><i class="flaticon flaticon-upload icon-sm"></i></button>`
                + `<button type="button" class="${pluginName}BtnViewerFile btn btn-info btn-sm ${hasFileSelected ? '' : 'hide'}" title="Visualizar Anexo"><i class="flaticon flaticon-view icon-sm"></i></button>`
            ;
        }

        #canDisplayActionButton() {
            const element = this.#input.get(0);

            return this.#settings.showActionButton
                && parent.ECM.workflowView.userPermissions.indexOf("P") >= 0
                && location.href.includes('ManagerMode')
                && !location.href.includes('token')
                && element.nodeName.toLowerCase() === "input"
                && !element.disabled
            ;
        }

        #changeButtonsState() {
            const hasFileSelected = this.#attachmentFilename.length !== 0;

            if (this.#canDisplayActionButton()) {
                if (hasFileSelected) {
                    this.#container.find(`.${pluginName}BtnUpuloadFile`).addClass("hide");
                    this.#container.find(`.${pluginName}BtnDeleteFile`).removeClass("hide");
                } else {
                    this.#container.find(`.${pluginName}BtnDeleteFile`).addClass("hide");
                    this.#container.find(`.${pluginName}BtnUpuloadFile`).removeClass("hide");
                }
            } else {
                this.#container.find(`.${pluginName}BtnAction`).addClass("hide");
            }

            if (hasFileSelected) {
                this.#container.find(`.${pluginName}BtnViewerFile`).removeClass("hide");
            } else {
                this.#container.find(`.${pluginName}BtnViewerFile`).addClass("hide");
            }
        }

        #confirmDeleteAttachment() {
            if (!this.#canDisplayActionButton()) {
                return;
            }

            FLUIGC.message.confirm({
                message: `Deseja remover o anexo <b>${this.#attachmentFilename}</b>?`,
                title: 'Confirmação',
                labelYes: 'Sim, quero remover',
                labelNo: 'Não, quero cancelar',
            }, result => {
                if (!result) {
                    return;
                }

                this.deleteAttachment();
            });
        }

        #uploadAttachment() {
            if (!this.#canDisplayActionButton()) {
                return;
            }

            let filename = this.#input.data("filename") || this.#settings.filename;

            if (this.#settings.prefixName === true) {
                filename = FLUIGC.utilities.randomUUID().substring(0, 9) + filename;
            } else if (this.#settings.prefixName !== false && isString(this.#settings.prefixName)) {
                filename = `${this.#settings.prefixName}-${filename}`;
            }

            // Evitar conflito de descrição do anexo
            if (attachmentFindIndex(filename) !== -1) {
                FLUIGC.toast({
                    title: "Atenção",
                    message: "Já existe um anexo com essa descrição",
                    type: "warning",
                })
                return;
            }

            parent.$("#ecm-navigation-inputFile-clone")
                .attr({
                    "data-on-camera": "true",
                    "data-file-name-camera": filename,
                    "data-inputid": this.#input.attr("id"),
                    "data-filename": filename,
                    "multiple": false,
                    "accept": this.#input.data("accept") || this.#settings.accept,
                })
                .trigger("click")
            ;
        }

        #viewAttachment() {
            const attachmentIndex = parent.ECM.attachmentTable.getData().findIndex(
                attachment => attachment.description === this.#attachmentFilename
            );

            if (attachmentIndex === -1) {
                FLUIGC.toast({
                    title: "Atenção",
                    message: "Anexo não encontrado",
                    type: "warning"
                });

                return;
            }

            const attachment = parent.ECM.attachmentTable.getRow(attachmentIndex);

            if (attachment.documentId) {
                parent.WKFViewAttachment.openAttachmentView(parent.WCMAPI.userCode, attachment.documentId, attachment.version);
            } else {
                parent.WKFViewAttachment.downloadAttach([attachmentIndex]);
            }
        }
    }

    /**
     * Instancia o Plugin ou executa algum método do plugin
     *
     * @param {AttachmentSettings|string} options
     * @returns {undefined|boolean|void}
     */
    $.fn[pluginName] = function (options) {
        if (!parent.WKFViewAttachment || !parent.ECM || !parent.ECM.attachmentTable) {
            console.error(`Plugin ${pluginName} executado fora de um processo.`)
            return this;
        }

        // Executa o Método
        if (isString(options)) {
            const methodName = options;
            const methodArgs = Array.prototype.slice.call(arguments, 1);

            let returnedValue = undefined;

            this.each(function () {
                let pluginData = $.data(this, pluginName);

                if (!pluginData) {
                    pluginData = new Plugin(this, {});
                    $.data(this, pluginName, pluginData);
                }

                if (!pluginData[methodName]) {
                    return;
                }

                returnedValue = pluginData[methodName](...methodArgs);

                if (returnedValue !== undefined) {
                    return false;
                }
            });

            return returnedValue !== undefined
                ? returnedValue
                : this
            ;
        }

        return this.each(function () {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new Plugin(this, options));
            }
        });
    };

    if (!parent.WKFViewAttachment || !parent.ECM || !parent.ECM.attachmentTable) {
        return;
    }

    const loading = FLUIGC.loading(window, {
        title: "Aguarde",
        textMessage: "Enviando arquivo",
    })

    $(() => {
        // Oculta aba anexos
        $("#tab-attachments", parent.document).hide();

        parent.$("#ecm_navigation_fileupload")
            .on(`fileuploadadd.${pluginName}`, function(e, data) {
                // Impede abrir o Loading caso tenha erro no arquivo

                const file = data.files[0];

                if (parent.ECM.maxUploadSize > 0 && file.size >= (parent.ECM.maxUploadSize * 1024 * 1024)) {
                    return;
                }

                if (parent.ECM.newAttachmentsDocs.length
                    && parent.ECM.newAttachmentsDocs.findIndex(attachment => attachment.name === file.name) !== -1
                ) {
                    return;
                }

                loading.show();
            })
            .on(`fileuploadfail.${pluginName}`, () => loading.hide())
            .on(`fileuploaddone.${pluginName}`, function() {
                // Atualiza o campo do arquivo caso o upload tenha ocorrido

                loading.hide();

                const btnUpload = parent.document.getElementById("ecm-navigation-inputFile-clone");
                const filename = btnUpload.getAttribute("data-filename");

                if (attachmentFindIndex(filename) === -1) {
                    return;
                }

                $(`#${btnUpload.getAttribute("data-inputid")}`).val(filename).trigger("change");
            });

        parent.$(document).on(`fileuploadstop.${pluginName}`, () => loading.hide());
    });


$("head").append(`<style>
.${pluginName}Component { display: flex; align-items: center; flex-wrap: nowrap; }
.${pluginName}Component input { border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; }
.${pluginName}Component_buttons { display: flex; align-items: center; justify-content: flex-end; }
.${pluginName}Component_buttons .btn { outline: none !important; outline-offset: unset !important; border-radius: 0 !important; height: 32px; }
</style>`);

}(jQuery));
