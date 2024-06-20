package com.example.todoapp;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.PopupWindow;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private TodoAdapter adapter;
    private TodoDatabaseHelper dbHelper;
    private List<Task> tasks;
    private Spinner filterSpinner;
    private PopupWindow filterPopup;
    private View filterPopupView;

    private CheckBox checkBoxTodo, checkBoxInProgress, checkBoxDone, checkBoxBug;
    private TextView applyButton;

    private ActivityResultLauncher<Intent> addTaskActivityResultLauncher;
    private ActivityResultLauncher<Intent> editTaskActivityResultLauncher;

    private static final int EDIT_TASK_REQUEST_CODE = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        dbHelper = new TodoDatabaseHelper(this);

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        View fab = findViewById(R.id.addBut);
        fab.setOnClickListener(view -> {
            Intent intent = new Intent(MainActivity.this, AddTaskActivity.class);
            addTaskActivityResultLauncher.launch(intent);
        });

        filterSpinner = findViewById(R.id.filterSpinner);
        ArrayAdapter<CharSequence> spinnerAdapter = ArrayAdapter.createFromResource(this, R.array.status_array, android.R.layout.simple_spinner_item);
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        filterSpinner.setAdapter(spinnerAdapter);

        filterSpinner.setOnTouchListener((v, event) -> {
            showFilterPopup();
            return true;
        });

        addTaskActivityResultLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK) {
                        Log.d("MainActivity", "New task added, reloading tasks...");
                        loadTasks();  // Reload tasks to reflect the new addition
                    }
                }
        );

        editTaskActivityResultLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Intent data = result.getData();
                        long taskId = data.getLongExtra("TASK_ID", -1);
                        if (taskId != -1) {
                            String taskName = data.getStringExtra("TASK_NAME");
                            String taskStatus = data.getStringExtra("TASK_STATUS");
                            String taskDescription = data.getStringExtra("TASK_DESCRIPTION");

                            // Update the task in the main list
                            for (Task task : tasks) {
                                if (task.getId() == taskId) {
                                    task.setName(taskName);
                                    task.setStatus(taskStatus);
                                    task.setDescription(taskDescription);
                                    break;
                                }
                            }

                            // Determine whether to apply filter or not
                            if (isNoFilterApplied()) {
                                displayTasks(tasks);  // Display all tasks
                            } else {
                                filterTasks();  // Reapply current filter
                            }
                        }
                    }
                }
        );

        loadTasks();
    }

    private void showFilterPopup() {
        if (filterPopup == null || filterPopupView == null) {
            filterPopupView = LayoutInflater.from(this).inflate(R.layout.filter, null);
            filterPopup = new PopupWindow(filterPopupView, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, true);
            filterPopup.setOutsideTouchable(true);
            filterPopup.setFocusable(true);
            filterPopup.setOnDismissListener(() -> filterPopup.dismiss());

            checkBoxTodo = filterPopupView.findViewById(R.id.checkBoxTodo);
            checkBoxInProgress = filterPopupView.findViewById(R.id.checkBoxInProgress);
            checkBoxDone = filterPopupView.findViewById(R.id.checkBoxDone);
            checkBoxBug = filterPopupView.findViewById(R.id.checkBoxBug);
            applyButton = filterPopupView.findViewById(R.id.apply_button);

            applyButton.setOnClickListener(v -> {
                filterTasks();
                filterPopup.dismiss();  // Close the popup window
            });
        }

        filterPopup.showAsDropDown(filterSpinner);
    }

    private void loadTasks() {
        tasks = dbHelper.getAllTasks();
        Log.d("MainActivity", "Tasks loaded: " + tasks.size());
        displayTasks(tasks);  // Display all tasks initially
    }

    private void filterTasks() {
        if (checkBoxTodo == null || checkBoxInProgress == null || checkBoxDone == null || checkBoxBug == null) {
            Log.e("MainActivity", "CheckBox views are not initialized.");
            return;
        }

        List<Task> filteredTasks = new ArrayList<>();

        for (Task task : tasks) {
            if ((checkBoxTodo.isChecked() && task.getStatus().equals("Todo")) ||
                    (checkBoxInProgress.isChecked() && task.getStatus().equals("In progress")) ||
                    (checkBoxDone.isChecked() && task.getStatus().equals("Done")) ||
                    (checkBoxBug.isChecked() && task.getStatus().equals("Bug"))) {
                filteredTasks.add(task);
            }
        }

        displayTasks(filteredTasks);  // Display filtered tasks
    }

    private void displayTasks(List<Task> taskList) {
        adapter = new TodoAdapter(taskList, this::onTaskLongClicked);
        recyclerView.setAdapter(adapter);
        Log.d("MainActivity", "Displayed tasks: " + taskList.size());
    }

    private void onTaskLongClicked(Task task) {
        Log.d("MainActivity", "Task long clicked: " + task.getName());
        try {
            Intent intent = new Intent(MainActivity.this, EditTaskActivity.class);
            intent.putExtra("TASK_ID", task.getId());
            intent.putExtra("TASK_NAME", task.getName());
            intent.putExtra("TASK_STATUS", task.getStatus());
            intent.putExtra("TASK_DESCRIPTION", task.getDescription());
            editTaskActivityResultLauncher.launch(intent);
        } catch (Exception e) {
            Log.e("MainActivity", "Error launching EditTaskActivity", e);
        }
    }

    private boolean isNoFilterApplied() {
        // Assurez-vous que les vues de CheckBox sont initialisées
        if (checkBoxTodo == null || checkBoxInProgress == null || checkBoxDone == null || checkBoxBug == null) {
            Log.e("MainActivity", "CheckBox views are not initialized.");
            return true;  // Retourne true si les vues ne sont pas initialisées pour éviter de filtrer involontairement
        }

        // Vérifiez si aucun filtre n'est appliqué
        return !checkBoxTodo.isChecked() && !checkBoxInProgress.isChecked() && !checkBoxDone.isChecked() && !checkBoxBug.isChecked();
    }
}
