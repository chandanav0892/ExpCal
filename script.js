class ExperienceCalculator {
    constructor() {
        console.log('ExperienceCalculator constructor called');
        this.experiences = this.loadExperiences();
        console.log('Loaded experiences:', this.experiences);
        this.currentMode = 'quick'; // Default mode
        this.initializeFlatpickr();
        this.initializeEventListeners();
        this.renderExperiences();
        this.updateTotalExperience();
        console.log('ExperienceCalculator initialized');
    }

    initializeFlatpickr() {
        const today = new Date();
        
        // Check if elements exist before initializing
        const startDateEl = document.getElementById('startDate');
        const endDateEl = document.getElementById('endDate');
        
        if (!startDateEl || !endDateEl) {
            console.error('Start or end date elements not found');
            return;
        }
        
        // Check if Flatpickr is available
        if (typeof flatpickr === 'undefined') {
            console.warn('Flatpickr not loaded, using regular date inputs');
            startDateEl.type = 'date';
            endDateEl.type = 'date';
            startDateEl.max = today.toISOString().split('T')[0];
            endDateEl.max = today.toISOString().split('T')[0];
            
            startDateEl.addEventListener('change', (e) => {
                if (e.target.value) {
                    endDateEl.min = e.target.value;
                }
            });
            return;
        }
        
        try {
            // Initialize start date picker
            this.startDatePicker = flatpickr(startDateEl, {
                dateFormat: "Y-m-d",
                maxDate: today,
                theme: "default",
                onChange: (selectedDates, dateStr) => {
                    console.log('Start date changed to:', dateStr);
                    // Update end date picker minimum date
                    if (this.endDatePicker) {
                        this.endDatePicker.set('minDate', dateStr);
                    }
                }
            });

            // Initialize end date picker
            this.endDatePicker = flatpickr(endDateEl, {
                dateFormat: "Y-m-d",
                maxDate: today,
                theme: "default",
                onChange: (selectedDates, dateStr) => {
                    console.log('End date changed to:', dateStr);
                }
            });
            
            console.log('Flatpickr initialized successfully');
        } catch (error) {
            console.error('Error initializing Flatpickr:', error);
            // Fallback to regular date inputs
            startDateEl.type = 'date';
            endDateEl.type = 'date';
            startDateEl.max = today.toISOString().split('T')[0];
            endDateEl.max = today.toISOString().split('T')[0];
        }
    }

    initializeEventListeners() {
        const form = document.getElementById('experienceForm');
        const currentJobCheckbox = document.getElementById('currentJob');
        const endDateInput = document.getElementById('endDate');
        const modeRadios = document.querySelectorAll('input[name="calculationMode"]');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Mode switching
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.switchMode(e.target.value));
        });

        currentJobCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.endDatePicker.clear();
                this.endDatePicker.set('disabled', true);
                endDateInput.style.opacity = '0.5';
            } else {
                this.endDatePicker.set('disabled', false);
                endDateInput.style.opacity = '1';
            }
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        const quickFields = document.getElementById('quickFields');
        const detailedFields = document.getElementById('detailedFields');
        const quickDesc = document.getElementById('quickModeDesc');
        const detailedDesc = document.getElementById('detailedModeDesc');
        
        // Update field visibility
        if (mode === 'quick') {
            quickFields.style.display = 'block';
            detailedFields.style.display = 'none';
            quickDesc.classList.add('active-desc');
            detailedDesc.classList.remove('active-desc');
            
            // Remove required attributes from detailed fields
            document.getElementById('companyName').removeAttribute('required');
            document.getElementById('position').removeAttribute('required');
        } else {
            quickFields.style.display = 'none';
            detailedFields.style.display = 'block';
            quickDesc.classList.remove('active-desc');
            detailedDesc.classList.add('active-desc');
            
            // Add required attributes to detailed fields
            document.getElementById('companyName').setAttribute('required', 'required');
            document.getElementById('position').setAttribute('required', 'required');
        }
        
        // Clear form when switching modes
        this.clearForm();
    }

    clearForm() {
        const form = document.getElementById('experienceForm');
        form.reset();
        
        // Clear flatpickr instances
        if (this.startDatePicker) this.startDatePicker.clear();
        if (this.endDatePicker) {
            this.endDatePicker.clear();
            this.endDatePicker.set('disabled', false);
        }
        
        const endDateInput = document.getElementById('endDate');
        endDateInput.style.opacity = '1';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Get date values directly from the inputs (Flatpickr updates the input values)
        const startDateValue = document.getElementById('startDate').value;
        const endDateValue = document.getElementById('endDate').value;
        const isCurrentJob = document.getElementById('currentJob').checked;
        
        const experienceData = {
            id: Date.now(),
            mode: this.currentMode,
            startDate: startDateValue,
            endDate: isCurrentJob ? null : endDateValue,
            isCurrentJob: isCurrentJob
        };

        // Add mode-specific data
        if (this.currentMode === 'detailed') {
            experienceData.companyName = formData.get('companyName')?.trim() || '';
            experienceData.position = formData.get('position')?.trim() || '';
        } else {
            experienceData.jobTitle = formData.get('jobTitle')?.trim() || 'Work Experience';
        }

        // Debug log
        console.log('Form submitted with data:', experienceData);

        // Validation
        if (!this.validateExperience(experienceData)) {
            return;
        }

        // Add experience
        this.experiences.push(experienceData);
        this.saveExperiences();
        this.renderExperiences();
        this.updateTotalExperience();
        
        // Reset form and show success message
        this.clearForm();
        this.showMessage('Experience added successfully! 🎉', 'success');
        
        // Debug log
        console.log('Experience added:', experienceData);
        console.log('Total experiences:', this.experiences.length);
    }

    validateExperience(data) {
        // Check if start date is provided
        if (!data.startDate) {
            this.showMessage('Please provide a start date.', 'error');
            return false;
        }

        // Mode-specific validation
        if (data.mode === 'detailed') {
            if (!data.companyName || !data.position) {
                this.showMessage('Please fill in company name and position for detailed mode.', 'error');
                return false;
            }
        }

        // Check if end date is provided when not current job
        if (!data.isCurrentJob && !data.endDate) {
            this.showMessage('Please provide an end date or mark as current job.', 'error');
            return false;
        }

        // Check if start date is not in the future
        const startDate = new Date(data.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        if (startDate > today) {
            this.showMessage('Start date cannot be in the future.', 'error');
            return false;
        }

        // Check if end date is not before start date
        if (data.endDate) {
            const endDate = new Date(data.endDate);
            if (endDate < startDate) {
                this.showMessage('End date cannot be before start date.', 'error');
                return false;
            }
            
            if (endDate > today) {
                this.showMessage('End date cannot be in the future.', 'error');
                return false;
            }
        }

        return true;
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Create Bootstrap toast
        const toastHtml = `
            <div class="toast ${type}-message" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white">
                    <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i>
                    <strong class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }

        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Initialize and show the toast
        const toastElement = toastContainer.lastElementChild;
        const toast = new bootstrap.Toast(toastElement, {
            delay: 5000
        });
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    calculateExperience(startDate, endDate = null) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        // Adjust for negative days
        if (days < 0) {
            months--;
            const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
            days += daysInPrevMonth;
        }

        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate total days
        const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        
        // Calculate total months (approximate)
        const totalMonths = years * 12 + months;

        return {
            years,
            months,
            days,
            totalDays,
            totalMonths,
            totalYears: Math.floor(totalDays / 365.25)
        };
    }

    formatDuration(experience) {
        const duration = this.calculateExperience(experience.startDate, experience.endDate);
        
        if (duration.years === 0 && duration.months === 0) {
            return `${duration.days} day${duration.days !== 1 ? 's' : ''}`;
        } else if (duration.years === 0) {
            return `${duration.months} month${duration.months !== 1 ? 's' : ''}, ${duration.days} day${duration.days !== 1 ? 's' : ''}`;
        } else {
            return `${duration.years} year${duration.years !== 1 ? 's' : ''}, ${duration.months} month${duration.months !== 1 ? 's' : ''}`;
        }
    }

    formatDateRange(startDate, endDate) {
        const options = { year: 'numeric', month: 'short' };
        const start = new Date(startDate).toLocaleDateString('en-US', options);
        const end = endDate ? new Date(endDate).toLocaleDateString('en-US', options) : 'Present';
        
        return `${start} - ${end}`;
    }

    renderExperiences() {
        const container = document.getElementById('experiencesList');
        
        if (this.experiences.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-briefcase display-1 opacity-25"></i>
                    <p class="mt-3">No experience added yet.<br>Add your first job above!</p>
                </div>
            `;
            return;
        }

        // Sort experiences by start date (newest first)
        const sortedExperiences = [...this.experiences].sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
        );

        container.innerHTML = sortedExperiences.map(exp => {
            const duration = this.formatDuration(exp);
            const dateRange = this.formatDateRange(exp.startDate, exp.endDate);
            const currentJobClass = exp.isCurrentJob ? 'current-job' : '';
            const modeClass = exp.mode || 'detailed'; // Default to detailed for backward compatibility
            
            // Generate content based on mode
            let titleContent = '';
            let companyContent = '';
            
            if (exp.mode === 'quick') {
                titleContent = `<div class="experience-title">
                    ${exp.jobTitle || 'Work Experience'}
                </div>`;
                companyContent = `<div class="experience-company">
                    <i class="bi bi-clock me-1"></i>Quick Mode Entry
                </div>`;
            } else {
                titleContent = `<div class="experience-title">
                    <i class="bi bi-person-badge text-primary me-2"></i>
                    ${exp.position || 'Position'}
                </div>`;
                companyContent = `<div class="experience-company">
                    <i class="bi bi-building me-1"></i>
                    ${exp.companyName || 'Company'}
                </div>`;
            }
            
            return `
                <div class="experience-item ${currentJobClass} ${modeClass}-mode" data-id="${exp.id}">
                    <button class="btn btn-danger btn-sm delete-btn" onclick="experienceCalculator.deleteExperience(${exp.id})" 
                            title="Delete this experience">
                        <i class="bi bi-trash"></i>
                    </button>
                    <div class="experience-header">
                        <div class="flex-grow-1">
                            ${titleContent}
                            ${companyContent}
                            <div class="experience-dates">
                                <i class="bi bi-calendar-range me-1"></i>
                                ${dateRange}
                            </div>
                        </div>
                        <div class="experience-duration">
                            <i class="bi bi-stopwatch me-1"></i>
                            ${duration}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    deleteExperience(id) {
        // Create Bootstrap modal for confirmation
        const modalHtml = `
            <div class="modal fade" id="deleteModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle me-2"></i>Confirm Delete
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">Are you sure you want to delete this experience? This action cannot be undone.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-lg me-2"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDelete">
                                <i class="bi bi-trash me-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('deleteModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
        
        // Handle delete confirmation
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.experiences = this.experiences.filter(exp => exp.id !== id);
            this.saveExperiences();
            this.renderExperiences();
            this.updateTotalExperience();
            this.showMessage('Experience deleted successfully! 🗑️', 'success');
            modal.hide();
        });
    }

    // Add print functionality
    printSummary() {
        try {
            const printContent = this.generatePrintableContent();
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.print();
            } else {
                this.showMessage('Pop-up blocked. Please allow pop-ups to print.', 'error');
            }
        } catch (error) {
            console.error('Print failed:', error);
            this.showMessage('Print failed. Please try again.', 'error');
        }
    }

    generatePrintableContent() {
        const exactExperienceEl = document.getElementById('exactExperience');
        const exactExperience = exactExperienceEl ? exactExperienceEl.textContent : 'Not available';
        
        const sortedExperiences = [...this.experiences].sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
        );
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Experience Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .experience { border-bottom: 1px solid #ddd; padding: 15px 0; }
        .experience:last-child { border-bottom: none; }
        .title { font-weight: bold; font-size: 1.1em; color: #007bff; }
        .company { color: #666; }
        .dates { color: #888; font-size: 0.9em; margin-top: 5px; }
        .duration { float: right; background: #e9ecef; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .no-experiences { text-align: center; color: #666; font-style: italic; padding: 20px; }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Work Experience Summary</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="summary">
        <h2>Total Experience Overview</h2>
        <p><strong>Total Experience:</strong> ${exactExperience}</p>
        <p><strong>Number of Positions:</strong> ${this.experiences.length}</p>
    </div>
    
    <div class="experiences">
        <h2>Experience Details</h2>
        ${sortedExperiences.length > 0 ? sortedExperiences.map(exp => {
            const duration = this.calculateExperience(exp.startDate, exp.endDate);
            const durationText = duration.years + 'y ' + duration.months + 'm ' + duration.days + 'd';
            
            return '<div class="experience">' +
                '<div class="duration">' + durationText + '</div>' +
                '<div class="title">' + (exp.jobTitle || exp.companyName || 'Position') + '</div>' +
                (exp.mode === 'detailed' ? '<div class="company">' + (exp.companyName || 'Company') + ' - ' + (exp.position || 'Position') + '</div>' : '') +
                '<div class="dates">' +
                    new Date(exp.startDate).toLocaleDateString() + ' - ' +
                    (exp.isCurrentJob ? 'Present' : new Date(exp.endDate).toLocaleDateString()) +
                    (exp.isCurrentJob ? ' (Current Position)' : '') +
                '</div>' +
            '</div>';
        }).join('') : '<div class="no-experiences">No experience records found.</div>'}
    </div>
    
    <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
        <p>Generated by Employee Experience Calculator</p>
    </div>
</body>
</html>`;
    }

    updateTotalExperience() {
        console.log('updateTotalExperience called with experiences:', this.experiences);
        
        // Check if DOM element exists
        const exactExperienceEl = document.getElementById('exactExperience');
        
        if (!exactExperienceEl) {
            console.error('Exact experience DOM element not found');
            return;
        }
        
        if (this.experiences.length === 0) {
            // Reset value when no experiences
            exactExperienceEl.textContent = '0 years, 0 months, 0 days';
            console.log('Reset total to 0 - no experiences');
            return;
        }

        // Calculate total experience by summing all individual experiences
        let totalDaysAccumulated = 0;

        this.experiences.forEach((exp, index) => {
            console.log(`Processing experience ${index + 1}:`, exp);
            const duration = this.calculateExperience(exp.startDate, exp.endDate);
            console.log(`Duration calculated:`, duration);
            
            totalDaysAccumulated += duration.totalDays;
        });

        console.log('Total days accumulated:', totalDaysAccumulated);

        // For exact calculation, convert total days to years, months, and remaining days
        const exactYears = Math.floor(totalDaysAccumulated / 365.25);
        const remainingDaysAfterYears = totalDaysAccumulated - (exactYears * 365.25);
        const exactMonths = Math.floor(remainingDaysAfterYears / 30.44); // Average days per month
        const exactDaysRemaining = Math.round(remainingDaysAfterYears - (exactMonths * 30.44));

        // Format exact experience text
        const exactText = `${exactYears} year${exactYears !== 1 ? 's' : ''}, ${exactMonths} month${exactMonths !== 1 ? 's' : ''}, ${exactDaysRemaining} day${exactDaysRemaining !== 1 ? 's' : ''}`;
        exactExperienceEl.textContent = exactText;
        
        // Add animation class
        exactExperienceEl.classList.add('updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            exactExperienceEl.classList.remove('updated');
        }, 600);
        
        // Debug log (can be removed in production)
        console.log('Total Experience Updated:', {
            totalDays: totalDaysAccumulated,
            exactYears,
            exactMonths,
            exactDaysRemaining,
            exactText
        });
    }

    // Local storage methods
    saveExperiences() {
        localStorage.setItem('employeeExperiences', JSON.stringify(this.experiences));
    }

    loadExperiences() {
        const saved = localStorage.getItem('employeeExperiences');
        return saved ? JSON.parse(saved) : [];
    }

    // Export functionality (bonus feature)
    exportExperiences() {
        try {
            const exactExperienceEl = document.getElementById('exactExperience');
            const exactExperience = exactExperienceEl ? exactExperienceEl.textContent : 'Not available';
            
            // Create PDF content using the same structure as print content
            const pdfContent = this.generatePDFContent(exactExperience);
            
            // Create a new window for PDF generation
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                this.showMessage('Pop-up blocked. Please allow pop-ups to export PDF.', 'error');
                return;
            }
            
            printWindow.document.write(pdfContent);
            printWindow.document.close();
            
            // Add PDF export functionality
            printWindow.addEventListener('load', () => {
                // Use browser's print to PDF functionality
                setTimeout(() => {
                    printWindow.print();
                    this.showMessage('PDF export initiated! Use "Save as PDF" in the print dialog. 📄', 'success');
                }, 500);
            });
            
        } catch (error) {
            console.error('PDF export failed:', error);
            this.showMessage('PDF export failed. Please try again.', 'error');
        }
    }

    generatePDFContent(exactExperience) {
        const sortedExperiences = [...this.experiences].sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
        );
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Work Experience Summary - PDF Export</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 0.75in;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.4;
                color: #333;
                margin: 0;
                padding: 0;
                background: white;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                page-break-after: avoid;
            }
            .header h1 {
                color: #007bff;
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: bold;
            }
            .header .subtitle {
                color: #666;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .summary {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #28a745;
                page-break-inside: avoid;
            }
            .summary h2 {
                color: #28a745;
                font-size: 20px;
                margin-bottom: 15px;
            }
            .summary-item {
                margin-bottom: 10px;
                font-size: 14px;
            }
            .summary-item strong {
                color: #333;
            }
            .experiences h2 {
                color: #007bff;
                font-size: 22px;
                margin-bottom: 25px;
                border-bottom: 2px solid #007bff;
                padding-bottom: 8px;
            }
            .experience {
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                background: white;
                page-break-inside: avoid;
                position: relative;
            }
            .experience:nth-child(even) {
                background: #f8f9fa;
            }
            .duration-badge {
                position: absolute;
                top: 15px;
                right: 15px;
                background: #007bff;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }
            .experience-title {
                font-weight: bold;
                font-size: 18px;
                color: #007bff;
                margin-bottom: 8px;
                margin-right: 120px;
            }
            .company-info {
                color: #666;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .date-range {
                color: #888;
                font-size: 13px;
                font-style: italic;
            }
            .current-job {
                background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%) !important;
                border-left: 4px solid #28a745;
            }
            .current-job .duration-badge {
                background: #28a745;
            }
            .no-experiences {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 40px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #e9ecef;
                padding-top: 20px;
            }
            .page-break {
                page-break-before: always;
            }
        }
        
        /* Screen styles for preview */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 20px;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #28a745;
        }
        .experience {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background: white;
            position: relative;
        }
        .duration-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #007bff;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Work Experience Summary</h1>
        <div class="subtitle">Professional Experience Report</div>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>
    </div>
    
    <div class="summary">
        <h2>📈 Summary Overview</h2>
        <div class="summary-item">
            <strong>Total Experience:</strong> ${exactExperience}
        </div>
        <div class="summary-item">
            <strong>Number of Positions:</strong> ${this.experiences.length}
        </div>
        <div class="summary-item">
            <strong>Career Start:</strong> ${this.experiences.length > 0 ? 
                new Date(Math.min(...this.experiences.map(exp => new Date(exp.startDate)))).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                : 'N/A'}
        </div>
    </div>
    
    <div class="experiences">
        <h2>💼 Detailed Experience History</h2>
        ${sortedExperiences.length > 0 ? sortedExperiences.map((exp, index) => {
            const duration = this.calculateExperience(exp.startDate, exp.endDate);
            const durationText = `${duration.years}y ${duration.months}m ${duration.days}d`;
            const isCurrentJob = exp.isCurrentJob;
            
            return `
                <div class="experience ${isCurrentJob ? 'current-job' : ''}">
                    <div class="duration-badge">${durationText}</div>
                    <div class="experience-title">
                        ${exp.mode === 'quick' ? 
                            (exp.jobTitle || 'Work Experience') : 
                            (exp.position || 'Position')
                        }
                    </div>
                    ${exp.mode === 'detailed' ? `
                        <div class="company-info">
                            🏢 ${exp.companyName || 'Company Name'}
                        </div>
                    ` : `
                        <div class="company-info">
                            ⚡ Quick Mode Entry
                        </div>
                    `}
                    <div class="date-range">
                        � ${new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                        ${isCurrentJob ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        ${isCurrentJob ? ' (Current Position)' : ''}
                    </div>
                </div>
            `;
        }).join('') : '<div class="no-experiences">📂 No experience records found.</div>'}
    </div>
    
    <div class="footer">
        <p>Generated by Employee Experience Calculator</p>
        <p>Export Date: ${new Date().toISOString()}</p>
    </div>
    
    <script>
        // Auto-focus for better print experience
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.focus();
            }, 100);
        });
    </script>
</body>
</html>`;
    }

    // Clear all data
    clearAllData() {
        const modalHtml = `
            <div class="modal fade" id="clearAllModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle me-2"></i>Clear All Data
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">Are you sure you want to clear all experience data? This action cannot be undone and will delete all your work experience entries.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-lg me-2"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-warning" id="confirmClearAll">
                                <i class="bi bi-trash me-2"></i>Clear All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('clearAllModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('clearAllModal'));
        modal.show();
        
        // Handle clear confirmation
        document.getElementById('confirmClearAll').addEventListener('click', () => {
            this.experiences = [];
            this.saveExperiences();
            this.renderExperiences();
            this.updateTotalExperience();
            this.showMessage('All experience data cleared! 🧹', 'success');
            modal.hide();
        });
    }
}

// Initialize the calculator when the page loads
let experienceCalculator;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Experience Calculator');
    try {
        experienceCalculator = new ExperienceCalculator();
        
        // Add export and clear buttons (optional enhancement)
        addUtilityButtons();
        
        console.log('Experience Calculator successfully initialized');
    } catch (error) {
        console.error('Error initializing Experience Calculator:', error);
    }
});

function addUtilityButtons() {
    // Find the Total Experience Summary card body more specifically
    const totalExperienceCards = document.querySelectorAll('.row.mt-4 .card-body');
    const totalExperienceSection = totalExperienceCards.length > 0 ? totalExperienceCards[0] : null;
    
    if (!totalExperienceSection) {
        console.error('Could not find Total Experience Summary section to add utility buttons');
        return;
    }
    
    // Check if buttons already exist to avoid duplicates
    const existingButtons = totalExperienceSection.querySelector('.utility-buttons');
    if (existingButtons) {
        console.log('Utility buttons already exist');
        return;
    }
    
    const utilityButtons = document.createElement('div');
    utilityButtons.className = 'utility-buttons mt-4 text-center';
    
    utilityButtons.innerHTML = `
        <div class="row g-2 justify-content-center">
            <div class="col-6 col-md-4 d-flex">
                <button onclick="experienceCalculator.exportExperiences()" 
                        class="btn btn-success flex-fill d-flex align-items-center justify-content-center" 
                        style="min-height: 42px;">
                    <i class="bi bi-download me-1"></i>Export or Print
                </button>
            </div>
            <div class="col-6 col-md-4 d-flex">
                <button onclick="experienceCalculator.clearAllData()" 
                        class="btn btn-danger flex-fill d-flex align-items-center justify-content-center"
                        style="min-height: 42px;">
                    <i class="bi bi-trash me-1"></i>Clear All
                </button>
            </div>
            <div class="col-12 col-md-4 d-flex">
                <button onclick="experienceCalculator.updateTotalExperience()" 
                        class="btn btn-warning flex-fill d-flex align-items-center justify-content-center"
                        style="min-height: 42px;">
                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                </button>
            </div>
        </div>
    `;
    
    totalExperienceSection.appendChild(utilityButtons);
    console.log('Utility buttons added successfully');
}

// Helper function for debugging (can be removed in production)
function logExperiences() {
    console.log('Current experiences:', experienceCalculator.experiences);
}

// Test function to add sample data for debugging
function addTestExperience() {
    const testExperience = {
        id: Date.now(),
        mode: 'quick',
        startDate: '2020-01-01',
        endDate: '2022-12-31',
        isCurrentJob: false,
        jobTitle: 'Test Job'
    };
    
    experienceCalculator.experiences.push(testExperience);
    experienceCalculator.renderExperiences();
    experienceCalculator.updateTotalExperience();
    experienceCalculator.saveExperiences();
    
    console.log('Test experience added:', testExperience);
}
