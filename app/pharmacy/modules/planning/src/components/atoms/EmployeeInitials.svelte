<script lang="ts">
	import { formatEmployeeInitials } from '../../domain/employees/employeeAppearance';
	import { readEmployeeColorClasses } from './employeeColor';

	type EmployeeInitialsProps = {
		fullName: string;
		colorIndex: number | undefined;
		size?: 'small' | 'medium';
	};

	let { fullName, colorIndex, size = 'small' }: EmployeeInitialsProps = $props();

	const sizeClasses = { small: 'h-5 w-5 text-[10px]', medium: 'h-[30px] w-[30px] text-[11.5px]' };
</script>

<span aria-hidden="true" class="inline-grid flex-none place-items-center rounded-full font-bold {sizeClasses[size]} {readEmployeeColorClasses(colorIndex).strong}">
	{formatEmployeeInitials(fullName)}
</span>
