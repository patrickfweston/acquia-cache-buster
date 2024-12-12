// On load, read the query string and populate the form.
$(document).ready(function () {
    const query_string = window.location.search;
    const url_params = new URLSearchParams(query_string);

    // Loop over each query string parameter
    for (let pair of url_params.entries()) {
        // Get the element by ID
        const element = $('#' + pair[0]);

        // If the element exists
        if (element.length) {
            // Set the value
            element.val(pair[1]);
        }
    }

    // Trigger the change event to update the commands box.
    $("#options").trigger('change');
});

// Toggle the Elastic IP address depending on whether CDN is enabled.
$("#cdn").on('click', function () {
    if ($(this).is(':checked')) {
        $("#eip").parent('div').show();
    } else {
        $("#eip").parent('div').hide();
    }
});

$("#copy").on('click', function () {
    const commands_box = $("#commands-box");
    // Copy the commands to the clipboard.
    const clipboard = new ClipboardJS('#copy', {
        text: function () {
            return commands_box.text();
        }
    });
    $("#copy-message").text("Copied to clipboard!");
});

$("#options").on('change', function () {
    // Add all the form elements changed to the query string.
    let query_string = '?';
    const elements = [
        '#realm',
        '#domain',
        '#bal-1',
        '#bal-2',
        '#sitename',
        '#path',
        '#ssl',
        '#cdn',
        '#eip'
    ];

    // Loop over each form element
    for (let i = 0; i < elements.length; i++) {
        // If the element is empty
        if ($(elements[i]).val() !== '') {
            query_string += $(elements[i]).attr('id') + '=' + $(elements[i]).val() + '&';
        }
    }

    // Remove the trailing ampersand
    query_string = query_string.slice(0, -1);

    // Update the URL
    window.history.pushState('', '', query_string);

    // If all the required fields are filled in, generate the commands.
    if (allFilledIn()) {
        // Clear the commands box.
        const commands_box = $("#commands-box");
        commands_box.empty();

        const non_ssl_template = 'curl -X PURGE -H "X-Acquia-Purge:[sitename]" --compressed -H "Host: [domain]" "http://[bal].[realm].hosting.acquia.com[path]";';
        const ssl_template = 'curl -k -X PURGE -H "X-Acquia-Purge:[sitename]" --compressed -H "Host: [domain]" "https://[bal].[realm].hosting.acquia.com[path]";';
        let cdn = 'curl -X PURGE -H "X-Acquia-Purge:[sitename]" -H "Accept-Encoding: gzip" -H "Host: [domain]" "http://[eip_address][path]";';

        let template;

        if ($("#ssl").is(':checked')) {
            template = ssl_template;
        } else {
            template = non_ssl_template;
        }

        // Process the template and replace values.
        template = template.replace('[sitename]', $("#sitename").val());
        template = template.replace('[domain]', $("#domain").val());
        template = template.replace('[bal]', $("#bal-1").val());
        template = template.replace('[realm]', $("#realm").val());
        template = template.replace('[path]', $("#path").val());

        // Add to the commands box.
        commands_box.append(template);

        // Add the second balancer if it's filled in.
        const bal_2 = $("#bal-2");
        if (bal_2.val() !== '') {
            template = template.replace($("#bal-1").val(), bal_2.val());
            commands_box.append('\n\n' + template);
        }

        // Lastly, add the CDN command if it's enabled.
        if ($("#cdn").is(':checked')) {
            cdn = cdn.replace('[sitename]', $("#sitename").val());
            cdn = cdn.replace('[domain]', $("#domain").val());
            cdn = cdn.replace('[eip_address]', $("#eip").val());
            cdn = cdn.replace('[path]', $("#path").val());

            commands_box.append('\n\n' + cdn);
        }

        $("#copy-box, #commands").show();
    } else {
        $("#copy-box, #commands").hide();
    }
});

function allFilledIn() {
    const elements = [
        '#realm',
        '#domain',
        '#bal-1',
        '#sitename'
    ];

    // Loop over each form element
    for (let i = 0; i < elements.length; i++) {
        // If the element is empty
        if ($(elements[i]).val() === '') {
            // Return false
            return false;
        }
    }

    return true;
}
