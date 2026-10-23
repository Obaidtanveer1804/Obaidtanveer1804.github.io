"""Portfolio content: the single source of truth for the website and the terminal.

Edit this file, then run `python3 tools/build_pages.py` from the repository root.
Longer text (project descriptions, experience bullet points) is read from the
detail pages under templates/ at build time, so it is written in one place only.
"""

NAME = "Obaid Tanveer"
FIRST_NAME = "Obaid"
TITLE = "Embedded Firmware Engineer"
LOCATION = "Besançon, France"
EMAIL = "obaidtanveer04@gmail.com"
GITHUB_URL = "https://github.com/Obaidtanveer1804"
LINKEDIN_URL = "https://www.linkedin.com/in/obaid-tanveer-1a889523b/"
PHOTO = "assets/profile.jpg"

TAGLINE = "Embedded engineer who writes the firmware behind EV chargers, battery packs and robots."
BIO = ("I write C and C++ for microcontrollers: STM32, ESP32 and RP2040. Three years "
       "across EV charging, battery management, industrial robotics and embedded QA. "
       "Now doing an M.Sc. in Electronics (ELISE) in Besançon and looking for an "
       "embedded internship or apprenticeship in France.")

STATS = [
    ("3", "Years of experience"),
    ("12", "Projects shipped"),
    ("6", "Roles in industry and labs"),
]

HIGHLIGHT_CARDS = [
    {"kind": "domains", "text": "EV charging, BMS, robotics"},
    {"kind": "stack", "text": "STM32, ESP32, FreeRTOS, ROS2"},
]

EXPERIENCE = [
    {
        "slug": "motive",
        "date": "Aug 2025 – Sep 2026",
        "role": "Embedded Systems QA Engineer",
        "org": "Motive",
        "summary": "Tested AI dashcams and Linux-based embedded products. Wrote test "
                   "profiles and automation scripts that widened coverage and cut about "
                   "two weeks of manual testing.",
        "page": "templates/experience/experience-motive.html",
    },
    {
        "slug": "powersoft",
        "date": "Nov 2024 – Aug 2025",
        "role": "Embedded Firmware Engineer",
        "org": "Powersoft",
        "summary": "Firmware for EV charging and battery management on dual-core STM32H7: "
                   "an L2 charger built from scratch, a Li-ion BMS over isoSPI and CAN, "
                   "freeV2G on Raspberry Pi, and an OTA bootloader.",
        "page": "templates/experience/experience-powersoft.html",
    },
    {
        "slug": "esforge",
        "date": "Jul 2023 – Nov 2024",
        "role": "Embedded Firmware Engineer, Robotics",
        "org": "Esforge",
        "summary": "Motor-control libraries for RP2040 (PIO) and ESP32 (FreeRTOS, LEDC), "
                   "firmware and PCBs for industrial food machines, closed-loop steppers "
                   "with AS5600 encoders.",
        "page": "templates/experience/experience-esforge.html",
    },
    {
        "slug": "epteck",
        "date": "Jul 2023 – Aug 2023",
        "role": "Embedded Engineering Intern",
        "org": "EPTeck Pvt. Ltd",
        "summary": "FreeRTOS on ESP32 for IoT projects, firmware debugging with senior "
                   "engineers, reusable C drivers for peripherals.",
        "page": "templates/experience/experience-epteck.html",
    },
    {
        "slug": "pieas-lab",
        "date": "6 months",
        "role": "Lab Assistant",
        "org": "PIEAS, Microprocessors & Interfacing Lab",
        "summary": "Taught STM32 assembly and C, timers, ADCs and GPIO in STM32CubeIDE "
                   "and Keil, and sensor interfacing.",
        "page": "templates/experience/experience-pieas.html",
    },
    {
        "slug": "109-aed",
        "date": "Aug 2022 – Sep 2022",
        "role": "Firmware Engineering Intern",
        "org": "109 AED",
        "summary": "Robotics simulation in CoppeliaSim, SolidWorks parts for prototypes, "
                   "embedded testing and debugging.",
        "page": "templates/experience/experience-aed.html",
    },
]

PROJECTS = [
    {"slug": "bms", "title": "Battery Management System",
     "subtitle": "STM32 + LTC6804 over isoSPI",
     "tags": ["STM32", "isoSPI", "LTC6804", "CAN", "C#/.NET"],
     "image": "assets/dc1941d.png", "page": "templates/projects/project-1.html"},
    {"slug": "l2-ev-charger", "title": "Level 2 EV Charger",
     "subtitle": "7.4 kW, IEC 61851-1 on STM32H7",
     "tags": ["STM32H7", "IEC 61851-1", "ADC", "CAN", "Relays"],
     "image": "assets/ev-connector-tn.png", "page": "templates/projects/project-2.html"},
    {"slug": "freev2g", "title": "freeV2G",
     "subtitle": "Vehicle-to-grid on Raspberry Pi",
     "tags": ["Raspberry Pi", "Whitebeet", "OpenEVSE", "V2G", "Python"],
     "image": "assets/whitebeet-2.png", "page": "templates/projects/project-3.html"},
    {"slug": "scara-ros2", "title": "SCARA Robot with ROS2",
     "subtitle": "ROS2 control, STM32 joints",
     "tags": ["ROS2", "STM32", "CoppeliaSim", "Python"],
     "image": "assets/ros-2.png", "page": "templates/projects/project-13.html"},
    {"slug": "6dof-arm", "title": "6-DOF Robot Arm",
     "subtitle": "Final-year project, CAN joints",
     "tags": ["STM32", "CoppeliaSim", "CAN"],
     "image": "assets/fyp-6dof.jpeg", "page": "templates/projects/project-4.html"},
    {"slug": "protein-press", "title": "Protein Bar Pressing Machine",
     "subtitle": "Industrial press controller",
     "tags": ["RP2040", "ESP32", "Robotics"],
     "image": "assets/protien-press.JPEG", "page": "templates/projects/project-5.html"},
    {"slug": "paratha-press", "title": "Paratha Pressing Machine",
     "subtitle": "FreeRTOS motion control",
     "tags": ["ESP32", "FreeRTOS", "Robotics"],
     "image": "assets/paratha-pressing-machine-asm.JPEG",
     "page": "templates/projects/project-6.html"},
    {"slug": "filling-machine", "title": "Filling Machine",
     "subtitle": "Multi-stepper dosing",
     "tags": ["RP2040", "ESP32", "Steppers", "C++"],
     "image": "assets/filling-machine-pcb.JPEG", "page": "templates/projects/project-7.html"},
    {"slug": "esp32-smartwatch", "title": "ESP32 Smartwatch",
     "subtitle": "Custom PCB, FreeRTOS",
     "tags": ["ESP32", "FreeRTOS", "C++"],
     "image": "assets/schematic-tn.png", "page": "templates/projects/project-9.html"},
    {"slug": "rp2040-stepper-lib", "title": "Stepper Library for RP2040",
     "subtitle": "PIO-timed, four motors",
     "tags": ["RP2040", "PIO", "C++"],
     "image": "assets/stepper-tn.jpeg", "page": "templates/projects/project-10.html"},
    {"slug": "smart-home-relay", "title": "Smart Home Relay Device",
     "subtitle": "ESP32 IoT switch",
     "tags": ["ESP32", "PlatformIO", "IoT"],
     "image": "assets/relay.png", "page": "templates/projects/project-11.html"},
    {"slug": "portfolio", "title": "This Portfolio",
     "subtitle": "Terminal + website, static HTML",
     "tags": ["HTML", "CSS", "JavaScript"],
     "image": "assets/pftn.png", "page": "templates/projects/project-12.html"},
]

# Toolkit grid: (name, label, devicon slug or None, short label shown without a logo)
TOOLS = [
    ("C / Embedded C", "Firmware language", "c", "C"),
    ("C++", "Drivers & libraries", "cplusplus", "C++"),
    ("Python", "Tooling & test automation", "python", "PY"),
    ("STM32", "F0, F4, H7 dual-core", None, "ST"),
    ("ESP32", "ESP-IDF, Arduino", None, "ESP"),
    ("Raspberry Pi", "Pico (RP2040) & Pi 4", "raspberrypi", "RPi"),
    ("FreeRTOS", "Real-time scheduling", None, "RTOS"),
    ("Linux", "Embedded Linux & Raspbian", "linux", "LNX"),
    ("ROS2", "Robot control", "ros", "ROS"),
    ("CAN / CANopen", "Automotive buses", None, "CAN"),
    ("Git", "Version control", "git", "GIT"),
    ("PlatformIO", "Build & flash", None, "PIO"),
]

SKILL_GROUPS = [
    ("languages", ["C", "Embedded C", "C++", "Python", "Assembly", "C#", "JavaScript"]),
    ("mcus", ["STM32 (F0, F4, H7)", "ESP32", "RP2040", "Raspberry Pi 4"]),
    ("rtos_os", ["FreeRTOS", "Linux", "Raspbian", "ROS2"]),
    ("protocols", ["CAN", "CANopen", "isoSPI", "SPI", "UART", "I2C", "BLE", "Ethernet"]),
    ("domains", ["EV charging", "Battery management", "Motor control", "Robotics",
                 "Sensor interfacing", "IoT", "Embedded test automation"]),
    ("tools", ["STM32CubeIDE", "ESP-IDF", "PlatformIO", "Keil", "Saleae", "CAN sniffer",
               "Oscilloscope", "CoppeliaSim", "Git"]),
]

EDUCATION = [
    {"slug": "msc-elise", "title": "M.Sc. Electronics, ELISE (M1)",
     "place": "Université Marie et Louis Pasteur, Besançon",
     "date": "2026 – present", "page": None,
     "summary": "Embedded electronic design, microcontrollers, FPGA, signal processing, "
                "digital control and instrumentation."},
    {"slug": "bsc-electrical", "title": "B.Sc. Electrical Engineering",
     "place": "PIEAS, Islamabad", "date": "2020 – 2024",
     "page": "templates/education/education-university.html",
     "summary": "Microprocessors, robotics, control systems, real-time embedded systems, "
                "FPGA design."},
    {"slug": "fsc", "title": "Intermediate (FSc), Pre-Engineering", "place": "College",
     "date": "", "page": "templates/education/education-intermediate.html", "summary": ""},
    {"slug": "matric", "title": "Matric, Science", "place": "High school", "date": "",
     "page": "templates/education/education-matric.html", "summary": ""},
]

COURSES = [
    {"slug": "ros2", "title": "ROS2 for Robotics",
     "page": "templates/education/course-ros2.html"},
    {"slug": "stm32-bootloader", "title": "STM32 Bootloader",
     "page": "templates/education/course-stm32-bootloader.html"},
    {"slug": "stm32-embedded-c", "title": "STM32 Embedded C",
     "page": "templates/education/course-stm32-embedded-c.html"},
    {"slug": "robotics-fundamentals", "title": "Robotics Fundamentals",
     "page": "templates/education/course-robotics.html"},
    {"slug": "canopen-stack", "title": "CANopen Stack",
     "page": "templates/education/course-canopen-stack.html"},
]
