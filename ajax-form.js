(function(exports, $) {

    /**
     * [_form description]
     * @type {[type]}
     */
    var _form = function() {
        this.$el = null;
        this.$activity = null;

        this.defaults = {
            el: null,
            url: null,
            method: null,
            activity: null,

            onSubmit: function() {},
            onSuccess: function() {},
            onErrors: function() {},
            onFieldError: function() {},
            onGlobalError: function() {}
        };
        this.settings = {};

        this.isSubmitting = false;
        this.isComplete = false;


        // --------- event handlers
        /**
         * [_onRequestDone description]
         * @type {[type]}
         */
        this._onRequestDone = function(response) {
            debug.log('ajaxForm::_onRequestDone - API done', response);

            if (!response.success) {
                return this._handleErrors(response);
            }

            return this._handleSuccess(response);
        };

        /**
         * [_onRequestFail description]
         * @type {[type]}
         */
        this._onRequestFail = function(response) {
            debug.error('ajaxForm::_onRequestFail - API failed!', response);

            this._handleRequestError();
        };

        /**
         * [_onFormSubmit description]
         * @type {[type]}
         */
        this._onFormSubmit = function(e) {
            var data, request;

            e.preventDefault();

            // if form already complete or submitting, prevent extra submission
            if (this.isSubmitting || this.isComplete) return;

            this.isSubmitting = true;

            // reveal activity indicator
            this.$activity.addClass('show');

            // serialize the form into a data object
            data = this.$el.serializeArray();

            // custom AJAX request to API
            request = $.ajax({
                url:        this.settings.url || this.$el.attr('action'),
                type:       this.settings.method || this.$el.attr('method'),
                data:       data,
                dataType:   'json'
            });

            // API request complete, process the response
            request.done(this._onRequestDone);
            request.fail(this._onRequestFail);

            // external hook
            this.settings.onSubmit.call(this);
        };


        // --------- private methods
        /**
         * [_handleErrors description]
         * @type {[type]}
         */
        this._handleErrors = function(response) {
            debug.warn('ajaxForm::_handleErrors - form submission had errors:', response);

            this.isSubmitting = false;

            // reveal activity indicator
            this.$activity.removeClass('show');

            // remove existing errors
            this.clearErrors();

            // apply new global and field errors
            this._applyFormErrors(response);

            // external hook
            this.settings.onErrors.call(this, response);

            return this;
        };

        /**
         * [_handleSuccess description]
         * @type {[type]}
         */
        this._handleSuccess = function(response) {
            debug.log('ajaxForm::_handleSuccess - form submission successful:', response);

            this.isComplete = true;

            // reveal activity indicator
            this.$activity.removeClass('show');

            // external hook
            this.settings.onSuccess.call(this, response);

            return this;
        };

        /**
         * [_handleRequestError description]
         * @type {[type]}
         */
        this._handleRequestError = function() {
            this.isSubmitting = false;

            // reveal activity indicator
            this.$activity.removeClass('show');

            this._applyGlobalError('There was an error submitting your form. Please try again later.');
        };

        /**
         * [_applyFormErrors description]
         * @type {[type]}
         */
        this._applyFormErrors = function(response) {
            var _this = this;

            // check for global error
            if (typeof response.error !== 'undefined') {
                this._applyGlobalError(response.error.message);
            }

            // loop object of field errors
            _.forOwn(response.validation_errors, function(v, k) {
                _this._applyFieldError(k, v);
            });
        };

        /**
         * [_applyFieldError description]
         * @type {[type]}
         */
        this._applyFieldError = function(field, error) {
            var $formGroup = this.$el.find(':input[name="' + field + '"]').closest('.form-group');

            // apply error styling
            $formGroup.addClass('has-error');

            // update error text
            $formGroup.find('.error').text(error);

            // external hook
            this.settings.onFieldError.call(this, field);
        };

        /**
         * [_applyGlobalError description]
         * @type {[type]}
         */
        this._applyGlobalError = function(error) {
            // external hook
            this.settings.onGlobalError.call(this, error);
        };


        // --------- public methods
        /**
         * [clearErrors description]
         * @type {[type]}
         */
        this.clearErrors = function() {
            // clear error styling
            this.$el.find('.has-error').removeClass('has-error');

            // hide global error message
            this.$el.find('.error--global')
                .removeClass('show');
        };

        /**
         * [bind description]
         * @type {[type]}
         */
        this.bind = function(options) {
            this.settings = $.extend(this.defaults, options);

            if (!this.settings.el) {
                return debug.error('ajaxForm::bind() - required form element missing.');
            }

            this.$el = $(this.settings.el);
            this.$activity = this.settings.activity ? $(this.settings.activity) : this.$el.find('.activity');

            // listen for form submission
            this.$el.on('submit', this._onFormSubmit);

            return this;
        };

        // ensure all functions have `this` bound to the current object
        _.bindAll(this);

    };


    // --------- exposed API
    /**
     * [ajaxForm description]
     * @type {Object}
     */
    var ajaxForm = {
        // factory
        create: function(options) {
            var f =  new _form();
            f.bind(options);
            return f;
        }
    };

    exports.ajaxForm = ajaxForm;

})(window, jQuery);
