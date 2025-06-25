import { useEffect, useState } from "react";

const ToggleSwitch = ({
	label,
	value,
	onChange,
	onColor = "bg-primaryColor",
	offColor = "bg-gray-200",
	thumbColor = "bg-white",
	className = "",
}) => {
	const [isOn, setIsOn] = useState(value);

	const handleToggle = () => {
		const newValue = !isOn;
		setIsOn(newValue);
		onChange(newValue);
	};

	useEffect(() => setIsOn(value), [value]);

	return (
		<div className={`flex justify-between items-center px-2 ${className}`}>
			{label && <div className="focus-label">{label}</div>}
			<div
				onClick={handleToggle}
				className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
					isOn ? onColor : offColor
				}`}
			>
				<div
					className={`w-4 h-4 ${thumbColor} rounded-full shadow-md transform transition-transform duration-300 ${
						isOn ? "translate-x-6" : "translate-x-0"
					}`}
				></div>
			</div>
		</div>
	);
};

export default ToggleSwitch;
